// Password reset routes.
//
// GET  /api/reset/:id — reset form (HTML) or "link expired" (HTML)
// POST /api/reset/:id — set a new password via a reset entry (HTML result)
// POST /api/reset     — create a reset entry + send the mail link (JSON)
//
// Notes:
// - The HTML form posts `application/x-www-form-urlencoded`, so POST /:id
//   accepts both JSON and urlencoded bodies (the legacy server parsed both).
// - Reset links expire after ten minutes and are removed after use.
import { Effect, Either } from "effect"
import bcrypt from "bcrypt"
import nodemailer from "nodemailer"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import User from "../models/user.js"
import Reset from "../models/reset.js"
import { email as serviceEmail, emailPW as serviceAppKey, environment, url as serviceUrl } from "../config.js"
import {
  errorValue,
  htmlResponse,
  jsonResponse,
  logRequest,
  mongooseErrorValue,
  orResponse,
  readJsonBody
} from "../middleware/middleware.js"

const dbError = (error: unknown): HttpServerResponse.HttpServerResponse =>
  mongooseErrorValue(error) ?? errorValue(500, { error: "something went wrong..." })

// Add an html body to the email.
const htmlForm = (text: string): string => {
  return `<body>
            <div align="center">
              ${text}
            </div>
          </body>`
}

const findResetById = (id: string) =>
  Effect.tryPromise({
    try: () => Reset.findOne({ _id: id, expireAt: { $gt: new Date() } }).exec(),
    catch: (error) => error
  }).pipe(Effect.mapError(dbError))

/** Read a `{ password }` payload from JSON or urlencoded form bodies. */
const readPasswordBody = (
  req: HttpServerRequest.HttpServerRequest
): Effect.Effect<{ password?: unknown } | HttpServerResponse.HttpServerResponse> =>
  Effect.gen(function* () {
    const asJson = yield* Effect.either(req.json)
    if (Either.isRight(asJson) && typeof asJson.right === "object" && asJson.right !== null) {
      return { password: (asJson.right as Record<string, unknown>).password }
    }
    const asText = yield* Effect.either(req.text)
    if (Either.isRight(asText)) {
      const params = new URLSearchParams(asText.right)
      return { password: params.get("password") ?? undefined }
    }
    return errorValue(400, { error: "invalid request body" })
  })

// Get reset form with id.
const getResetForm = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const reset = yield* orResponse(findResetById(id))
  if (HttpServerResponse.isServerResponse(reset)) return reset
  if (!reset) {
    return yield* htmlResponse(htmlForm("<h2>The link has expired</h2>"), 404)
  }

  return yield* htmlResponse(
    htmlForm(`<h1>Changing your password</h1>
            <form action="/api/reset/${id}" method="post">
              New password:
              <br>
              <input type="password" name="password" minlength="11" required>
              <button type="submit">Update</button>
            </form>`)
  )
})

// Update password with id if the reset has not expired.
const updatePassword = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const maybeBody = yield* readPasswordBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  const { password } = maybeBody

  const reset = yield* orResponse(findResetById(id))
  if (HttpServerResponse.isServerResponse(reset)) return reset
  if (!reset) {
    return yield* htmlResponse(htmlForm("<h2>The link has expired<h2>"), 404)
  }

  if (typeof password !== "string" || password.length < 11) {
    return yield* htmlResponse(htmlForm("<h2>Password must have at least 11 characters</h2>"), 400)
  }

  const user = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findOne({ email: reset.email }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(user)) return user
  if (!user) {
    return yield* htmlResponse(htmlForm("<h2>The link has expired<h2>"), 404)
  }

  const passwordHash = yield* orResponse(
    Effect.tryPromise({
      try: () => bcrypt.hash(password, 12),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(passwordHash)) return passwordHash

  const updated = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findByIdAndUpdate(user._id, { passwordHash }, { new: true }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(updated)) return updated

  const removed = yield* orResponse(
    Effect.tryPromise({
      try: () => Reset.findByIdAndDelete(reset._id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(removed)) return removed

  return yield* htmlResponse(htmlForm("<h2>Your password has been updated<h2>"))
})

// Create and send a reset link to the users email.
const createReset = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody

  const rawEmail = typeof maybeBody.email === "string" ? maybeBody.email : undefined
  if (!rawEmail) {
    return yield* jsonResponse({ error: "No email was provided." }, 400)
  }
  const email = rawEmail.toLowerCase()

  const user = yield* orResponse(
    Effect.tryPromise({
      try: () => User.findOne({ email }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(user)) return user
  if (!user) {
    return yield* jsonResponse({ error: "There is no account with that email." }, 400)
  }
  const localPreview = environment === "development"
  if (!localPreview && (!serviceEmail || !serviceAppKey)) {
    return yield* jsonResponse({ error: "Password reset email is not configured." }, 503)
  }

  const created = yield* orResponse(
    Effect.tryPromise({
      try: () =>
        new Reset({ email: user.email }).save().then((saved) => saved),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(created)) return created

  const resetUrl = `${serviceUrl}/api/reset/${String(created._id)}`

  // A local development server can show the link directly when SMTP is absent.
  // Production never exposes a reset token in an API response.
  if (localPreview) {
    return yield* jsonResponse({ success: "Reset link created for local development.", resetUrl })
  }

  // gmail transporter (same settings as the legacy implementation).
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: serviceEmail,
      pass: serviceAppKey
    }
  })

  const mailOptions = {
    from: serviceEmail,
    to: user.email,
    subject: "Password reset request",
    html: `<h1> Hello ${user.email}!</h1>
       <p>You can change your password using the link below</p>
       <p>The link is valid for 10 minutes</p>
       <a href="${resetUrl}">${resetUrl}</a>`
  }

  const sent = yield* Effect.either(Effect.tryPromise({
    try: () => transporter.sendMail(mailOptions).then((): void => undefined),
    catch: (error) => error
  }))
  if (Either.isLeft(sent)) {
    yield* Effect.tryPromise(() => Reset.findByIdAndDelete(created._id).exec()).pipe(
      Effect.catchAll(() => Effect.void)
    )
    return yield* jsonResponse({ error: "Reset email could not be sent." }, 503)
  }

  return yield* jsonResponse({ success: "Reset created and email sent." })
})

export const passwordResetRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/reset/:id", getResetForm),
  HttpRouter.post("/api/reset/:id", updatePassword),
  HttpRouter.post("/api/reset", createReset)
)

export default passwordResetRouter
