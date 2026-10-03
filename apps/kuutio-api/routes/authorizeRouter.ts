// Service-side SSO endpoint for @intranet/kuutio-api.
//
// POST /api/authorize      — users service announces an authenticated user
//                             (service_key check) and gets a one-time user_key
// GET  /api/authorize/:key — client redeems the user_key for the token
// GET  /api/authorize      — caller user data (authorization level 1)
//
// The pending handshakes live in a module-level Map and expire after
// 10 minutes (same in-memory semantics as the legacy implementation).
import { randomUUID } from "node:crypto"
import { Effect } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import { SERVICE_KEY, SERVICE_NAME, USERS_URL } from "../config.js"
import { requireLevel } from "../middleware/authorize.js"
import {
  jsonResponse,
  logBody,
  logRequest,
  orResponse,
  readJsonBody,
  textResponse
} from "../middleware/middleware.js"

interface StoredToken {
  token: string
  expires: number
}

// A storage where temporary keys are mapped to tokens, removed once the key
// is used or once it expires.
const tokenStorage = new Map<string, StoredToken>()

// Remove expired tokens from the tokenStorage.
const pruneTokenStorage = (): void => {
  tokenStorage.forEach((value, key) => {
    if (value.expires < Date.now()) {
      tokenStorage.delete(key)
    }
  })
}

// The users service sends a post request here to inform this service that
// the user has been authenticated. The returned user_key lets the client
// fetch the token via GET /api/authorize/:key.
const mintUserKey = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  const email = typeof maybeBody.email === "string" ? maybeBody.email : undefined
  const token = typeof maybeBody.token === "string" ? maybeBody.token : undefined
  const serviceKey = typeof maybeBody.service_key === "string" ? maybeBody.service_key : undefined

  if (!email) return yield* textResponse("email, was not provided", 400)
  if (!token) return yield* textResponse("token missing", 401)
  if (!serviceKey) return yield* textResponse("invalid key", 401)

  if (serviceKey !== SERVICE_KEY) {
    // The key parameter was named correctly but the key itself was incorrect.
    return yield* textResponse("invalid key", 401)
  }

  // Generate a key that is guaranteed to be unique.
  const userKey = randomUUID()

  tokenStorage.set(userKey, {
    token,
    expires: Date.now() + 600000 // expires in 10 minutes
  })

  pruneTokenStorage()

  return yield* jsonResponse({ user_key: userKey })
})

// The client redeems the user_key for the token.
const redeemUserKey = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const params = yield* HttpRouter.params
  const key = params.key ?? ""

  if (!tokenStorage.has(key)) {
    return yield* textResponse("invalid key", 401)
  }

  const stored = tokenStorage.get(key) as StoredToken
  if (stored.expires < Date.now()) {
    tokenStorage.delete(key)
    return yield* textResponse("expired key", 401)
  }

  tokenStorage.delete(key)

  return yield* jsonResponse({ token: stored.token })
})

// A client that has a token can get their user data (level 1 required).
const getOwnUser = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* orResponse(requireLevel(req, 1, USERS_URL, SERVICE_NAME))
  if (HttpServerResponse.isServerResponse(auth)) return auth

  return yield* jsonResponse(auth, 200)
})

export const authorizeRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/authorize", mintUserKey),
  HttpRouter.get("/api/authorize/:key", redeemUserKey),
  HttpRouter.get("/api/authorize", getOwnUser)
)

export default authorizeRouter
