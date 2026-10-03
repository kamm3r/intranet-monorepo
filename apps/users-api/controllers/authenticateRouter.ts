// Authentication routes (email + password login).
//
// POST /api/authenticate            — login, returns { token, ...user }
// POST /api/authenticate/:domain    — login + service handshake via Effect
//                                     HttpClient, returns { token, user_key, ...user }
import { Effect } from "effect"
import bcrypt from "bcrypt"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import User, { type UserDocument } from "../models/user.js"
import Service from "../models/service.js"
import {
  jsonResponse,
  logBody,
  logRequest,
  orResponse,
  readJsonBody,
  errorValue
} from "../middleware/middleware.js"
import { requestServiceUserKey } from "../middleware/authorize.js"

const findUserByEmail = (
  email: string
): Effect.Effect<UserDocument | null, HttpServerResponse.HttpServerResponse> =>
  Effect.tryPromise({
    try: () => User.findOne({ email }).exec(),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

const findServiceByDomain = (domain: string) =>
  Effect.tryPromise({
    try: () => Service.findOne({ domain }).exec(),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

const comparePasswords = (
  password: string,
  passwordHash: string
): Effect.Effect<boolean, HttpServerResponse.HttpServerResponse> =>
  Effect.tryPromise({
    try: () => bcrypt.compare(password, passwordHash),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

const signUserToken = (
  user: UserDocument
): Effect.Effect<string, HttpServerResponse.HttpServerResponse> =>
  Effect.try({
    try: () => user.generateJWT(),
    catch: () => errorValue(500, { error: "something went wrong..." })
  })

const readCredentials = (body: Record<string, any>): { email?: string; password?: string } => ({
  email: typeof body.email === "string" ? body.email : undefined,
  password: typeof body.password === "string" ? body.password : undefined
})

// Authenticate user without forwarding them to any service.
const login = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const { email, password } = readCredentials(maybeBody)
  if (!email) return yield* jsonResponse({ error: "email is missing" }, 400)
  if (!password) return yield* jsonResponse({ error: "password is missing" }, 400)

  const normalizedEmail = email.toLowerCase()

  const maybeUser = yield* orResponse(findUserByEmail(normalizedEmail))
  if (HttpServerResponse.isServerResponse(maybeUser)) return maybeUser
  if (!maybeUser) {
    return yield* jsonResponse({ error: "invalid email or password" }, 401)
  }

  const passwordCorrect = yield* orResponse(comparePasswords(password, maybeUser.passwordHash))
  if (HttpServerResponse.isServerResponse(passwordCorrect)) return passwordCorrect
  if (!passwordCorrect) {
    return yield* jsonResponse({ error: "invalid email or password" }, 401)
  }

  const token = yield* orResponse(signUserToken(maybeUser))
  if (HttpServerResponse.isServerResponse(token)) return token

  return yield* jsonResponse({ token, ...User.format(maybeUser) })
})

// Authenticate user and authorize them to use a specific service.
// Returns a key that a client can use to get a token from the service
// defined in the domain parameter.
const loginToService = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const params = yield* HttpRouter.params
  const domain = (params.domain ?? "").toLowerCase()

  const maybeService = yield* orResponse(findServiceByDomain(domain))
  if (HttpServerResponse.isServerResponse(maybeService)) return maybeService
  if (!maybeService) {
    return yield* jsonResponse({ error: "unauthorized domain" }, 401)
  }

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const { email, password } = readCredentials(maybeBody)
  if (!email) return yield* jsonResponse({ error: "email is missing" }, 400)
  if (!password) return yield* jsonResponse({ error: "password is missing" }, 400)

  const normalizedEmail = email.toLowerCase()

  const maybeUser = yield* orResponse(findUserByEmail(normalizedEmail))
  if (HttpServerResponse.isServerResponse(maybeUser)) return maybeUser
  if (!maybeUser) {
    return yield* jsonResponse({ error: "invalid email or password" }, 401)
  }

  const passwordCorrect = yield* orResponse(comparePasswords(password, maybeUser.passwordHash))
  if (HttpServerResponse.isServerResponse(passwordCorrect)) return passwordCorrect
  if (!passwordCorrect) {
    return yield* jsonResponse({ error: "invalid email or password" }, 401)
  }

  const token = yield* orResponse(signUserToken(maybeUser))
  if (HttpServerResponse.isServerResponse(token)) return token

  // Confirm to the service that the user has been authenticated.
  const userKey = yield* orResponse(
    requestServiceUserKey({
      protocol: maybeService.protocol,
      domain,
      serviceKey: maybeService.serviceKey,
      email: normalizedEmail,
      token
    })
  )
  if (HttpServerResponse.isServerResponse(userKey)) return userKey

  // token is used by the user service and the user_key is used by the
  // service on the domain.
  return yield* jsonResponse({ token, user_key: userKey, ...User.format(maybeUser) })
})

export const authenticateRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/authenticate", login),
  HttpRouter.post("/api/authenticate/:domain", loginToService)
)

export default authenticateRouter
