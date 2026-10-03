// Authorization helpers for @intranet/users-api.
//
// The token blacklist is kept in memory only (same as the legacy Express
// implementation): entries are lost on restart, so token lifetimes should
// stay short. TODO: move the blacklist to Redis so it survives restarts and
// works across replicas.
import { Effect, Option } from "effect"
import jwt from "jsonwebtoken"
import {
  Headers,
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"

import { getJwtSecretSync } from "../config.js"
import { errorValue } from "./middleware.js"

export interface AccessEntry {
  service?: unknown
  level: number
  name?: string
}

export interface AuthUser {
  _id: string
  email: string
  firstname?: string
  lastname?: string
  admin: boolean
  access: Array<AccessEntry>
}

interface JwtPayload {
  _id?: string
  email?: string
  firstname?: string
  lastname?: string
  admin?: boolean
  access?: Array<AccessEntry>
}

let tokenBlacklist: Array<string> = []
let nextPrune = Date.now()

// Remove expired tokens from the blacklist (at most once every 6 hours).
const pruneTokenBlacklist = (): void => {
  if (Date.now() < nextPrune) return

  tokenBlacklist = tokenBlacklist.filter((token) => {
    try {
      jwt.verify(token, getJwtSecretSync())
      return true
    } catch {
      return false
    }
  })

  nextPrune = Date.now() + 1000 * 60 * 60 * 6
}

/** Add a token to the in-memory logout blacklist. */
export const blacklistToken = (token: string | null): void => {
  if (token) tokenBlacklist.push(token)
}

/** Parse the bearer token out of the Authorization header. */
export const getTokenFromRequest = (
  req: HttpServerRequest.HttpServerRequest
): string | null => {
  const authorization = Option.getOrNull(Headers.get(req.headers, "authorization"))
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7)
  }
  return null
}

/** jsonwebtoken verify wrapped in Effect.try. */
export const verifyTokenEffect = (token: string): Effect.Effect<JwtPayload, unknown> =>
  Effect.try({
    try: () => jwt.verify(token, getJwtSecretSync()) as JwtPayload,
    catch: (error) => error
  })

/** jsonwebtoken sign wrapped in Effect.try. */
export const signTokenEffect = (
  payload: Record<string, unknown>
): Effect.Effect<string, unknown> =>
  Effect.try({
    try: () => jwt.sign(payload, getJwtSecretSync(), { expiresIn: "2d" }),
    catch: (error) => error
  })

const authErrorName = (error: unknown): string | undefined =>
  (error as { name?: string } | null)?.name ?? undefined

const authErrorMessage = (error: unknown): string =>
  (error as { message?: string } | null)?.message ?? "invalid token"

/**
 * Authenticate a request. Never fails: yields either the authenticated user
 * or a ready-made 401 response (narrow with
 * `HttpServerResponse.isServerResponse(...)`).
 */
export const authenticateRequest = (
  req: HttpServerRequest.HttpServerRequest
): Effect.Effect<AuthUser | HttpServerResponse.HttpServerResponse> =>
  Effect.suspend(() => {
    pruneTokenBlacklist()

    const token = getTokenFromRequest(req)
    if (!token) {
      return Effect.succeed(errorValue(401, { error: "token missing or too short" }))
    }
    if (tokenBlacklist.includes(token)) {
      return Effect.succeed(errorValue(401, { error: "invalid token user has logged out." }))
    }

    return verifyTokenEffect(token).pipe(
      Effect.flatMap((decoded) => {
        if (!decoded._id) {
          return Effect.succeed<AuthUser | HttpServerResponse.HttpServerResponse>(
            errorValue(401, { error: "invalid token" })
          )
        }
        const user: AuthUser = {
          _id: decoded._id,
          email: decoded.email ?? "",
          firstname: decoded.firstname,
          lastname: decoded.lastname,
          admin: decoded.admin ?? false,
          access: decoded.access ?? []
        }
        return Effect.succeed<AuthUser | HttpServerResponse.HttpServerResponse>(user)
      }),
      Effect.catchAll((error) =>
        Effect.succeed<AuthUser | HttpServerResponse.HttpServerResponse>(
          authErrorName(error) === "TokenExpiredError"
            ? errorValue(401, { error: "token expired" })
            : errorValue(401, { error: authErrorMessage(error) })
        )
      )
    )
  })

/** Ensure the authenticated user is an admin; null when authorized. */
export const requireAdmin = (user: AuthUser): HttpServerResponse.HttpServerResponse | null =>
  user.admin ? null : errorValue(401, { error: "unauthorized user" })

/**
 * Confirm authentication to a downstream service via Effect HttpClient POST
 * to `<protocol>://<domain>/api/authorize` with the shared `service_key`,
 * returning the one-time `user_key` for the client. (Replaces axios.)
 */
export const requestServiceUserKey = (args: {
  protocol: string
  domain: string
  serviceKey: string
  email: string
  token: string
}): Effect.Effect<string, HttpServerResponse.HttpServerResponse, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient
    const url = `${args.protocol}://${args.domain}/api/authorize`

    const body = yield* HttpBody.json({
      email: args.email,
      token: args.token,
      service_key: args.serviceKey
    }).pipe(Effect.mapError(() => errorValue(500, { error: "service authorization failed" })))

    const request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("content-type", "application/json"),
      HttpClientRequest.setBody(body)
    )

    const response = yield* client
      .execute(request)
      .pipe(Effect.mapError(() => errorValue(500, { error: "service authorization failed" })))

    if (response.status !== 200) {
      return yield* Effect.fail(errorValue(500, { error: "service authorization failed" }))
    }

    const data = (yield* response.json.pipe(
      Effect.mapError(() => errorValue(500, { error: "service authorization failed" }))
    )) as { user_key?: unknown }

    if (typeof data.user_key !== "string") {
      return yield* Effect.fail(errorValue(500, { error: "service authorization failed" }))
    }
    return data.user_key
  })

export default {
  blacklistToken,
  getTokenFromRequest,
  authenticateRequest,
  requireAdmin,
  verifyTokenEffect,
  signTokenEffect,
  requestServiceUserKey
}
