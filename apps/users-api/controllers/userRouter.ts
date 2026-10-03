// User management routes.
//
// POST   /api/users       — register (open)
// GET    /api/users       — own user data (auth)
// GET    /api/users/all   — all users (auth + admin)
// DELETE /api/users/:id   — delete user (auth + admin)
// PUT    /api/users/:id   — update user (auth + admin)
import { Effect } from "effect"
import bcrypt from "bcrypt"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import User, { type AccessEntry, type UserDocument } from "../models/user.js"
import Service from "../models/service.js"
import { authenticateRequest, requireAdmin, type AuthUser } from "../middleware/authorize.js"
import {
  errorValue,
  jsonResponse,
  emptyResponse,
  logBody,
  logRequest,
  mongooseErrorValue,
  orResponse,
  readJsonBody
} from "../middleware/middleware.js"

const dbError = (error: unknown): HttpServerResponse.HttpServerResponse =>
  mongooseErrorValue(error) ?? errorValue(500, { error: "something went wrong..." })

const hashPassword = (
  password: string
): Effect.Effect<string, HttpServerResponse.HttpServerResponse> =>
  Effect.tryPromise({
    try: () => bcrypt.hash(password, 12),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

const addAccessLevel = (
  user: UserDocument,
  level: number
): Effect.Effect<void, HttpServerResponse.HttpServerResponse> =>
  Effect.tryPromise({
    try: () =>
      Service.find({})
        .exec()
        .then((services) => {
          user.access = services.map((service) => ({
            service: service._id,
            level,
            name: service.name
          })) as Array<AccessEntry>
        }),
    catch: (error) => error
  }).pipe(Effect.mapError(dbError))

// Register a new user.
const register = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const rawEmail = typeof maybeBody.email === "string" ? maybeBody.email : undefined
  const password = typeof maybeBody.password === "string" ? maybeBody.password : undefined
  const firstname = typeof maybeBody.firstname === "string" ? maybeBody.firstname : undefined
  const lastname = typeof maybeBody.lastname === "string" ? maybeBody.lastname : undefined

  if (!rawEmail) return yield* jsonResponse({ error: "email is missing" }, 400)
  if (!password) return yield* jsonResponse({ error: "password is missing" }, 400)

  const email = rawEmail.toLowerCase()

  const passwordHash = yield* orResponse(hashPassword(password))
  if (HttpServerResponse.isServerResponse(passwordHash)) return passwordHash

  const user = new User({ email, passwordHash, firstname, lastname, access: [] })

  // Add access level 1 by default to all services.
  const accessResult = yield* orResponse(addAccessLevel(user, 1))
  if (HttpServerResponse.isServerResponse(accessResult)) return accessResult

  const saved = yield* Effect.tryPromise({
    try: () => user.save(),
    catch: (error) => error
  }).pipe(
    Effect.mapError((error) => {
      const message = (error as { message?: string })?.message ?? ""
      if (message.includes("User validation failed")) {
        return errorValue(400, { error: "user validation failed" })
      }
      return errorValue(500, { error: "something went wrong..." })
    }),
    orResponse
  )
  if (HttpServerResponse.isServerResponse(saved)) return saved

  return yield* jsonResponse(User.format(saved))
})

// A client with a valid token can get their user data.
const getOwnUser = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const maybeUser = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findById(auth._id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(maybeUser)) return maybeUser
  if (!maybeUser) {
    return yield* jsonResponse({ error: `Cannot find user with id: ${auth._id}` }, 401)
  }

  return yield* jsonResponse(User.format(maybeUser))
})

const requireAdminUser = (auth: AuthUser): HttpServerResponse.HttpServerResponse | null =>
  requireAdmin(auth)

// Get all users.
const getAllUsers = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth
  const adminError = requireAdminUser(auth)
  if (adminError) return adminError

  const users = yield* orResponse(
    Effect.tryPromise({
      try: () => User.find({}).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(users)) return users

  return yield* jsonResponse(users.map(User.format))
})

// Delete a user.
const deleteUser = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth
  const adminError = requireAdminUser(auth)
  if (adminError) return adminError

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const existing = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findById(id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(existing)) return existing
  if (!existing) {
    return yield* jsonResponse({ error: `Cannot find user with id: ${id}` }, 401)
  }

  const deleted = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findByIdAndDelete(id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(deleted)) return deleted

  return yield* emptyResponse(204)
})

// An admin user can update any users admin and access rights.
const updateUser = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth
  const adminError = requireAdminUser(auth)
  if (adminError) return adminError

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const updates: Record<string, unknown> = {}
  if (typeof maybeBody.admin === "boolean") updates.admin = maybeBody.admin
  if (typeof maybeBody.firstname === "string") updates.firstname = maybeBody.firstname
  if (typeof maybeBody.lastname === "string") updates.lastname = maybeBody.lastname
  if (Array.isArray(maybeBody.access)) {
    updates.access = maybeBody.access.filter((entry: { level?: number }) => entry.level !== 0)
  }

  if (Object.keys(updates).length === 0) {
    return yield* jsonResponse({ error: "No valid fields to update." }, 400)
  }

  const updated = yield* orResponse(
    Effect.tryPromise({
      try: () =>
        User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(updated)) return updated
  if (!updated) {
    return yield* jsonResponse({ error: "User does not exist." }, 400)
  }

  return yield* jsonResponse(User.format(updated))
})

export const userRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/users", register),
  HttpRouter.get("/api/users/all", getAllUsers),
  HttpRouter.del("/api/users/:id", deleteUser),
  HttpRouter.put("/api/users/:id", updateUser),
  HttpRouter.get("/api/users", getOwnUser)
)

export default userRouter
