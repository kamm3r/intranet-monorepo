// Booking routes for @intranet/kuutio-api.
//
// POST   /api/booking                  — create a booking
// GET    /api/booking/getbookings       — all bookings
// GET    /api/booking/getbookings/:date — bookings for a date
// DELETE /api/booking/:id              — remove a booking owned by the user
//
// All routes require SSO authorization level 1 against the users service
// (the legacy `router.use(requireAuthorization(1))` was commented out; it is
// enabled here as specified).
import { Effect, Either } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import { Booking } from "../models/bookingModel.js"
import { SERVICE_NAME, USERS_URL } from "../config.js"
import { requireLevel } from "../middleware/authorize.js"
import {
  errorValue,
  jsonResponse,
  logBody,
  logRequest,
  orResponse,
  readJsonBody
} from "../middleware/middleware.js"

interface BookingInput {
  topic?: unknown
  name?: unknown
  selectedDate?: unknown
  selectedTime?: unknown
  endingTime?: unknown
}

interface BookingFailure {
  statuscode?: number
  message?: string
}

const toFailure = (error: unknown): BookingFailure =>
  (error as BookingFailure) ?? { message: "unknown error" }

const helsinkiParts = (date: Date) => Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])
) as Record<"year" | "month" | "day" | "hour" | "minute", number>

const dayKey = (parts: ReturnType<typeof helsinkiParts>) =>
  `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`

const isBooked = async (date: unknown, times: unknown): Promise<boolean> => {
  try {
    const bookings = await Booking.find({ selectedDate: date })

    for (const booking of bookings) {
      for (const bookingTime of booking.selectedTime) {
        if (Array.isArray(times) && (times as Array<unknown>).includes(bookingTime)) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    console.log((error as Error).message)
    throw new Error("Error checking doublebookings")
  }
}

const validateBooking = async (newBooking: BookingInput): Promise<void> => {
  const slots = Array.from({ length: 21 }, (_, index) => {
    const minutes = 7 * 60 + 30 + index * 30
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
  })
  if (
    typeof newBooking.topic !== "string" || !newBooking.topic.trim() ||
    typeof newBooking.name !== "string" || !newBooking.name.trim() ||
    !newBooking.selectedDate ||
    !Array.isArray(newBooking.selectedTime) || newBooking.selectedTime.length === 0 ||
    typeof newBooking.endingTime !== "string"
  ) {
    throw {
      statuscode: 400,
      message: "Send all required fields: topic, name, date, time, endingtime"
    }
  }
  const date = new Date(newBooking.selectedDate as string)
  const selected = newBooking.selectedTime as string[]
  const positions = selected.map((time) => slots.indexOf(time))
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() - 24 * 60 * 60 * 1000 ||
    selected.length > 4 || positions.some((position) => position < 0) ||
    positions.some((position, index) => index > 0 && position !== positions[index - 1] + 1)) {
    throw { statuscode: 400, message: "Invalid booking date or time" }
  }
  const bookingDay = helsinkiParts(date)
  const current = helsinkiParts(new Date())
  if (bookingDay.hour !== 0 || bookingDay.minute !== 0 || date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0 || dayKey(bookingDay) < dayKey(current) ||
    (dayKey(bookingDay) === dayKey(current) &&
      positions[0] * 30 + 7 * 60 + 30 <= current.hour * 60 + current.minute)) {
    throw { statuscode: 400, message: "Booking must start in the future on a valid calendar day" }
  }
  const last = selected[selected.length - 1]
  const [hour, minute] = last.split(":").map(Number)
  const ending = `${String(hour + (minute === 30 ? 1 : 0)).padStart(2, "0")}:${minute === 30 ? "00" : "30"}`
  if (newBooking.endingTime !== ending) {
    throw { statuscode: 400, message: "Invalid ending time" }
  }
  const alreadyBooked = await isBooked(newBooking.selectedDate, newBooking.selectedTime)
  if (alreadyBooked) {
    throw { statuscode: 409, message: "Error, selected time already booked!" }
  }
}

const dbError = (error: unknown): HttpServerResponse.HttpServerResponse =>
  (error as { code?: number })?.code === 11000
    ? errorValue(409, { message: "Selected time already booked" })
    : errorValue(500, { message: (error as Error)?.message ?? "unknown error" })

const authorized = (req: HttpServerRequest.HttpServerRequest) =>
  orResponse(requireLevel(req, 1, USERS_URL, SERVICE_NAME))

// Route for posting a new Booking.
const createBooking = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authorized(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const newBooking: BookingInput = {
    topic: maybeBody.topic,
    name: maybeBody.name,
    selectedDate: maybeBody.selectedDate,
    selectedTime: maybeBody.selectedTime,
    endingTime: maybeBody.endingTime
  }

  const validation = yield* Effect.either(
    Effect.tryPromise({
      try: () => validateBooking(newBooking),
      catch: (error) => toFailure(error)
    })
  )
  if (Either.isLeft(validation)) {
    const failure = validation.left
    return yield* jsonResponse(
      { message: failure.message },
      failure.statuscode ?? 500
    )
  }

  const created = yield* orResponse(
    Effect.tryPromise({
      try: () => Booking.create({ ...newBooking, createdBy: auth.email }).then((booking) => booking),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(created)) return created

  return yield* jsonResponse(created, 201)
})

// Route for Get All Bookings from the database.
const getBookings = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authorized(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const bookings = yield* orResponse(
    Effect.tryPromise({
      try: () => Booking.find({}).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(bookings)) return bookings

  return yield* jsonResponse({ count: bookings.length, data: bookings })
})

const getBookingsByDate = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authorized(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const date = params.date ?? ""

  const bookings = yield* orResponse(
    Effect.tryPromise({
      try: () => Booking.find({ selectedDate: date }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(bookings)) return bookings

  return yield* jsonResponse({ count: bookings.length, data: bookings })
})

const deleteBooking = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authorized(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const id = params.id ?? ""
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return yield* jsonResponse({ message: "Invalid booking id" }, 400)
  }

  const existing = yield* orResponse(
    Effect.tryPromise({
      try: () => Booking.findById(id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(existing)) return existing

  if (existing) {
    if (!auth.admin && existing.createdBy !== auth.email) {
      return yield* jsonResponse({ message: "Only the booking owner can remove it" }, 403)
    }
    const removed = yield* orResponse(
      Effect.tryPromise({
        try: () => Booking.findByIdAndDelete(id).exec(),
        catch: (error) => error
      }).pipe(Effect.mapError(dbError))
    )
    if (HttpServerResponse.isServerResponse(removed)) return removed

    return yield* jsonResponse({ message: "Booking removed" })
  }

  return yield* jsonResponse({ message: "Booking not found" }, 404)
})

export const bookingRoute = HttpRouter.empty.pipe(
  HttpRouter.post("/api/booking", createBooking),
  HttpRouter.get("/api/booking/getbookings/:date", getBookingsByDate),
  HttpRouter.get("/api/booking/getbookings", getBookings),
  HttpRouter.del("/api/booking/:id", deleteBooking)
)

export default bookingRoute
