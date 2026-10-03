// SSO authorization against the users service via Effect HttpClient
// (replaces axios).
//
// `requireLevel(level)` checks the caller's token with
// `GET <USERS_URL>/api/authorize/service/<SERVICE_NAME>/<level>` and yields
// the user info on success or a ready-made 401 response on failure.
import { Effect, Either, Option } from "effect"
import {
  Headers,
  HttpClient,
  HttpClientRequest,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"

import { textValue } from "./middleware.js"

export interface ServiceUser {
  email: string
  admin: boolean
  access: unknown
}

const authFailed = (): HttpServerResponse.HttpServerResponse =>
  textValue(401, "Authorization failed in the users service.")

/**
 * Ask authorization from the users service. Yields either the authorized
 * user or a ready-made 401 response (narrow with
 * `HttpServerResponse.isServerResponse(...)`).
 */
export const requireLevel = (
  req: HttpServerRequest.HttpServerRequest,
  level: number,
  usersUrl: string,
  serviceName: string
): Effect.Effect<ServiceUser | HttpServerResponse.HttpServerResponse, never, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const token = Option.getOrNull(Headers.get(req.headers, "authorization"))

    if (!token) {
      return textValue(401, "token missing")
    }

    const client = yield* HttpClient.HttpClient
    const request = HttpClientRequest.get(
      `${usersUrl}/api/authorize/service/${serviceName}/${level}`
    ).pipe(HttpClientRequest.setHeader("Authorization", token))

    const executed = yield* client
      .execute(request)
      .pipe(Effect.mapError(() => authFailed()), Effect.either)
    if (Either.isLeft(executed)) return executed.left
    const response = executed.right
    if (response.status !== 200) return authFailed()

    const parsed = yield* response.json.pipe(Effect.mapError(() => authFailed()), Effect.either)
    if (Either.isLeft(parsed)) return parsed.left

    const body = parsed.right as { email?: unknown; admin?: unknown; access?: unknown }
    if (typeof body.email !== "string" || !body.email.trim()) return authFailed()
    const user: ServiceUser = {
      email: body.email,
      admin: body.admin === true,
      access: body.access
    }
    return user
  })

export default { requireLevel }
