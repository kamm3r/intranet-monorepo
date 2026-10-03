/**
 * @intranet/auth-server — shared SSO helpers for the intranet service APIs.
 *
 * Effect-based replacement for the previous Express/axios implementation.
 *
 * Wire semantics (kept identical to the old middleware):
 * - Missing `Authorization` header            -> 401 "token missing"
 * - Users-service check fails (non-200)       -> 401 with the upstream body
 * - Users-service unreachable / other failure -> 500 "authorization check failed"
 * - POST /api/authorize without email         -> 400 "email, was not provided"
 * - POST /api/authorize without token         -> 401 "token missing"
 * - POST /api/authorize with missing/wrong
 *   service_key                               -> 401 "invalid key"
 * - POST success                              -> 200 { user_key } (10-min, single use)
 * - GET /api/authorize/:key unknown           -> 401 "invalid key"
 * - GET /api/authorize/:key expired           -> 401 "expired key"
 * - GET /api/authorize/:key success           -> 200 { token } (redeemed once)
 */
import { randomUUID } from "node:crypto"
import { Effect, Option } from "effect"
import {
  Headers,
  HttpClient,
  HttpClientRequest,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"

export interface AuthorizedUser {
  readonly email: string
  readonly admin: boolean
  readonly access: unknown
}

export interface CreateRequireAuthorizationOptions {
  /** Base URL of the users service, e.g. http://localhost:4001 */
  readonly usersUrl: string
  /**
   * Service name registered in the users service.
   * When set, authorization is checked against
   * `/api/authorize/service/:name/:level`; when omitted (portal),
   * the plain `/api/authorize` endpoint is used (level is ignored).
   */
  readonly serviceName?: string | undefined
}

/**
 * Wraps a route handler with an authorization check.
 * On success the handler runs with the authorized user;
 * on failure a 401/500 response is returned directly.
 */
export type AuthorizeHandler = <A, E, R>(
  handler: (user: AuthorizedUser) => Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>
) => Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E,
  R | HttpClient.HttpClient | HttpServerRequest.HttpServerRequest
>

export type RequireAuthorization = (level?: number) => AuthorizeHandler

/** Permissive CORS headers applied to every response (matches old `cors()` usage). */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
}

export const withCors = (
  response: HttpServerResponse.HttpServerResponse
): HttpServerResponse.HttpServerResponse => HttpServerResponse.setHeaders(response, corsHeaders)

/** 204 response for CORS preflight (OPTIONS) requests. */
export const corsPreflight: Effect.Effect<HttpServerResponse.HttpServerResponse> = Effect.succeed(
  withCors(HttpServerResponse.empty({ status: 204 }))
)

type AuthResult =
  | { readonly _tag: "Authorized"; readonly user: AuthorizedUser }
  | { readonly _tag: "Rejected"; readonly response: HttpServerResponse.HttpServerResponse }

export const createRequireAuthorization = (
  options: CreateRequireAuthorizationOptions
): RequireAuthorization => {
  const { usersUrl, serviceName } = options
  if (!usersUrl) throw new Error("auth-server: usersUrl is required")

  const check = (
    level: number
  ): Effect.Effect<AuthResult, never, HttpClient.HttpClient | HttpServerRequest.HttpServerRequest> =>
    Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest
      const token = Option.getOrElse(Headers.get(request.headers, "authorization"), () => "")
      if (token.trim() === "") {
        return {
          _tag: "Rejected",
          response: withCors(HttpServerResponse.text("token missing", { status: 401 }))
        } as AuthResult
      }

      const url =
        serviceName === undefined
          ? `${usersUrl}/api/authorize`
          : `${usersUrl}/api/authorize/service/${serviceName}/${level}`
      const outgoing = HttpClientRequest.get(url).pipe(
        HttpClientRequest.setHeader("authorization", token)
      )

      const client = yield* HttpClient.HttpClient
      const outcome = yield* Effect.exit(client.execute(outgoing))
      if (outcome._tag === "Failure") {
        return {
          _tag: "Rejected",
          response: withCors(HttpServerResponse.text("authorization check failed", { status: 500 }))
        } as AuthResult
      }

      const upstream = outcome.value
      if (upstream.status !== 200) {
        const body = yield* Effect.orElseSucceed(upstream.text, () => "")
        return {
          _tag: "Rejected",
          response: withCors(
            HttpServerResponse.text(
              body === "" ? "Authorization failed in the users service." : body,
              { status: 401 }
            )
          )
        } as AuthResult
      }

      const data = (yield* Effect.orElseSucceed(upstream.json, () => ({}))) as {
        readonly email?: unknown
        readonly admin?: unknown
        readonly access?: unknown
      }
      return {
        _tag: "Authorized",
        user: {
          email: data.email as string,
          admin: data.admin as boolean,
          access: data.access
        }
      } as AuthResult
    })

  const requireAuthorization: RequireAuthorization = (level = 1) => (handler) =>
    Effect.flatMap(check(level), (result) =>
      result._tag === "Authorized" ? handler(result.user) : Effect.succeed(result.response))

  return requireAuthorization
}

export interface CreateAuthorizeRouterOptions {
  /** Shared secret the users service sends as `service_key`. */
  readonly serviceKey: string
  /** Access level required for GET / (default 1). */
  readonly requiredLevel?: number | undefined
  /** TTL for minted user_keys in ms (default 600000 = 10 min). */
  readonly tokenTTLms?: number | undefined
  /** Authorization guard from createRequireAuthorization. */
  readonly authorizer: RequireAuthorization
}

interface StoredToken {
  readonly token: string
  readonly expires: number
}

export const createAuthorizeRouter = (
  options: CreateAuthorizeRouterOptions
): HttpRouter.HttpRouter<never, HttpClient.HttpClient> => {
  const { serviceKey, requiredLevel = 1, tokenTTLms = 600_000, authorizer } = options
  if (!serviceKey) throw new Error("auth-server: serviceKey is required")
  if (!authorizer) throw new Error("auth-server: authorizer (requireAuthorization fn) is required")

  // One-time keys mapped to users-service tokens; entries are removed
  // once redeemed or once expired.
  const storage = new Map<string, StoredToken>()

  const prune = (): void => {
    const now = Date.now()
    for (const [key, value] of storage) {
      if (value.expires < now) storage.delete(key)
    }
  }

  return HttpRouter.empty.pipe(
    // The users service posts here after authenticating a user; we mint a
    // one-time user_key the client redeems for the token below.
    HttpRouter.post(
      "/",
      Effect.gen(function*() {
        const request = yield* HttpServerRequest.HttpServerRequest
        const body = (yield* Effect.orElseSucceed(request.json, () => ({}))) as {
          readonly email?: unknown
          readonly token?: unknown
          readonly service_key?: unknown
        }
        if (typeof body.email !== "string" || body.email === "") {
          return withCors(HttpServerResponse.text("email, was not provided", { status: 400 }))
        }
        if (typeof body.token !== "string" || body.token === "") {
          return withCors(HttpServerResponse.text("token missing", { status: 401 }))
        }
        if (body.service_key === undefined || body.service_key !== serviceKey) {
          return withCors(HttpServerResponse.text("invalid key", { status: 401 }))
        }

        const user_key = randomUUID()
        storage.set(user_key, { token: body.token, expires: Date.now() + tokenTTLms })
        prune()

        return withCors(HttpServerResponse.unsafeJson({ user_key }))
      })
    ),
    // The client redeems the one-time user_key for the token exactly once.
    HttpRouter.get(
      "/:key",
      Effect.gen(function*() {
        const params = yield* HttpRouter.params
        const key = params["key"]
        const entry = key === undefined ? undefined : storage.get(key)
        if (entry === undefined) {
          return withCors(HttpServerResponse.text("invalid key", { status: 401 }))
        }
        if (entry.expires < Date.now()) {
          storage.delete(key as string)
          return withCors(HttpServerResponse.text("expired key", { status: 401 }))
        }
        storage.delete(key as string)
        return withCors(HttpServerResponse.unsafeJson({ token: entry.token }))
      })
    ),
    // All routes below require authorization (mirrors the old router.use(...)).
    HttpRouter.get("/", authorizer(requiredLevel)((user) => Effect.succeed(withCors(HttpServerResponse.unsafeJson(user)))))
  )
}
