// Authorization endpoint.
//
// GET /api/authorize/app/:domain      — authorize to a service (handshake, needs token)
// GET /api/authorize                  — current user info (needs token)
// GET /api/authorize/service/:name/:level — access-level check (needs token)
// GET /api/authorize/logout           — blacklist token (needs token)
//
// NOTE: the logout blacklist is in-memory only and is lost on restart.
// TODO: move it to Redis.
import { Effect } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import User from "../models/user.js"
import Service from "../models/service.js"
import {
  authenticateRequest,
  blacklistToken,
  getTokenFromRequest,
  requestServiceUserKey
} from "../middleware/authorize.js"
import {
  errorValue,
  jsonResponse,
  emptyResponse,
  logRequest,
  orResponse
} from "../middleware/middleware.js"

const findServiceByDomain = (domain: string) =>
  Effect.tryPromise({
    try: () => Service.findOne({ domain }).exec(),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

const findServiceByName = (name: string) =>
  Effect.tryPromise({
    try: () => Service.findOne({ name }).exec(),
    catch: (error) => error
  }).pipe(Effect.mapError(() => errorValue(500, { error: "something went wrong..." })))

// Authorize the user to use a specific service that does authorization by
// itself. Returns a one-time key for the service on the domain parameter.
const authorizeApp = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const domain = (params.domain ?? "").toLowerCase()
  const token = getTokenFromRequest(req) ?? ""

  const maybeService = yield* orResponse(findServiceByDomain(domain))
  if (HttpServerResponse.isServerResponse(maybeService)) return maybeService
  if (!maybeService) {
    return yield* jsonResponse({ error: "unauthorized domain" }, 401)
  }

  // Confirm to the service that the user has been authenticated.
  const userKey = yield* orResponse(
    requestServiceUserKey({
      protocol: maybeService.protocol,
      domain,
      serviceKey: maybeService.serviceKey,
      email: auth.email,
      token
    })
  )
  if (HttpServerResponse.isServerResponse(userKey)) return userKey

  return yield* jsonResponse({ user_key: userKey, ...User.format(auth) })
})

// Return user information for a client with a valid token.
const authorizeRoot = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  return yield* jsonResponse(User.format(auth))
})

// Check whether the user has a high enough authorization level requested by
// the service.
const authorizeServiceLevel = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const name = params.name ?? ""
  const level = parseInt(params.level ?? "", 10)

  let access = auth.access.find((entry) => entry.name === name)

  if (!access) {
    // In case the service name is not defined in the token.
    const maybeService = yield* orResponse(findServiceByName(name))
    if (HttpServerResponse.isServerResponse(maybeService)) return maybeService
    if (!maybeService) {
      return yield* jsonResponse({ error: "The service does not exist." }, 401)
    }

    access = auth.access.find((entry) => String(entry.service) === String(maybeService._id))
  }

  if (!access) {
    return yield* jsonResponse(
      { error: "The user has no access level on this service." },
      401
    )
  }

  if (access.level < level) {
    return yield* jsonResponse(
      { error: "The user does not have a high enough access level on this service." },
      401
    )
  }

  return yield* jsonResponse(User.format(auth))
})

// Blacklist the request token so it can no longer be used.
const logout = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authenticateRequest(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  blacklistToken(getTokenFromRequest(req))

  return yield* emptyResponse(200)
})

export const authorizeRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/authorize/app/:domain", authorizeApp),
  HttpRouter.get("/api/authorize/service/:name/:level", authorizeServiceLevel),
  HttpRouter.get("/api/authorize/logout", logout),
  HttpRouter.get("/api/authorize", authorizeRoot)
)

export default authorizeRouter
