// Shared HTTP helpers: manual CORS headers (replaces the `cors` package),
// JSON/text/HTML/empty response constructors, JSON body parsing, and the
// `orResponse` adapter that turns "failures are ready-made responses" effects
// into value-channel unions for route handlers.
import { Effect } from "effect"
import { HttpServerRequest, HttpServerResponse } from "@effect/platform"

import logger from "./logger.js"

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

export const withCors = (
  response: HttpServerResponse.HttpServerResponse
): HttpServerResponse.HttpServerResponse =>
  HttpServerResponse.setHeaders(response, corsHeaders)

/** Plain (non-Effect) error response value for use inside Effect failure maps. */
export const errorValue = (
  status: number,
  body: unknown
): HttpServerResponse.HttpServerResponse =>
  withCors(HttpServerResponse.unsafeJson(body, { status }))

const encodeFallback = (): HttpServerResponse.HttpServerResponse =>
  withCors(HttpServerResponse.unsafeJson({ error: "response encoding failed" }, { status: 500 }))

export const jsonResponse = (
  body: unknown,
  status?: number
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  HttpServerResponse.json(body, status === undefined ? undefined : { status }).pipe(
    Effect.map(withCors),
    Effect.orElseSucceed(encodeFallback)
  )

export const textResponse = (
  body: string,
  status = 200
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  Effect.succeed(withCors(HttpServerResponse.setStatus(HttpServerResponse.text(body), status)))

export const htmlResponse = (
  html: string,
  status = 200
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  Effect.succeed(withCors(HttpServerResponse.setStatus(HttpServerResponse.html(html), status)))

export const emptyResponse = (
  status = 200
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  Effect.succeed(withCors(HttpServerResponse.empty({ status })))

/**
 * Parse the request JSON body. Never fails: yields either the parsed object
 * (non-object payloads become `{}`) or a ready-made 400 response.
 */
export const readJsonBody = (
  req: HttpServerRequest.HttpServerRequest
): Effect.Effect<Record<string, any> | HttpServerResponse.HttpServerResponse> =>
  req.json.pipe(
    Effect.map((parsed: unknown) =>
      typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, any>)
        : ({} as Record<string, any>)
    ),
    Effect.catchAll(() => Effect.succeed(errorValue(400, { error: "invalid json" })))
  )

/**
 * Run an effect whose failures are already HTTP responses and yield a
 * value-or-response union instead. Handlers narrow with
 * `HttpServerResponse.isServerResponse(...)` and `return` the response early.
 */
export const orResponse = <A, R>(
  self: Effect.Effect<A, HttpServerResponse.HttpServerResponse, R>
): Effect.Effect<A | HttpServerResponse.HttpServerResponse, never, R> =>
  Effect.catchAll(self, (response) => Effect.succeed(response))

/** Map Mongoose errors to responses. Returns null when not a known mapping. */
export const mongooseErrorValue = (error: unknown): HttpServerResponse.HttpServerResponse | null => {
  const named = error as { name?: string; message?: string }
  if (named?.name === "CastError") {
    return errorValue(400, { error: "malformatted id" })
  }
  if (named?.name === "ValidationError") {
    return errorValue(400, { error: named.message ?? "validation failed" })
  }
  return null
}

export const logRequest = (
  req: HttpServerRequest.HttpServerRequest
): Effect.Effect<void> =>
  Effect.sync(() => {
    logger.info("Method:", req.method)
    logger.info("Path:  ", req.url)
    logger.info("---")
  })

const redactBody = (body: unknown): unknown => {
  if (Array.isArray(body)) return body.map(redactBody)
  if (body && typeof body === "object") {
    return Object.fromEntries(Object.entries(body).map(([key, value]) => [
      key,
      /password|token|secret|key/i.test(key) ? "[REDACTED]" : redactBody(value)
    ]))
  }
  return body
}

export const logBody = (body: unknown): Effect.Effect<void> =>
  Effect.sync(() => {
    logger.info("Body:  ", redactBody(body))
    logger.info("---")
  })
