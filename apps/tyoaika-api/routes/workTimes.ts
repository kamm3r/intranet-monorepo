import { Cause, Effect, Option } from "effect"
import { HttpClient, HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { withCors, type RequireAuthorization } from "@intranet/auth-server"
import { WorkTime } from "../models/workTime.js"

const ok = (body: unknown): HttpServerResponse.HttpServerResponse =>
  withCors(HttpServerResponse.unsafeJson(body))

const malformedId = (): HttpServerResponse.HttpServerResponse =>
  withCors(HttpServerResponse.unsafeJson({ error: "malformatted id" }, { status: 400 }))

const logCause = (message: string, cause: Cause.Cause<unknown>): Effect.Effect<void> =>
  Effect.logError(message, Cause.pretty(cause))

/** Maps mongoose failures to the historical status codes/messages. */
const mongooseError = (cause: unknown): HttpServerResponse.HttpServerResponse => {
  const error = cause as { readonly name?: string; readonly message?: string }
  if (error?.name === "CastError") return malformedId()
  if (error?.name === "ValidationError") {
    return withCors(HttpServerResponse.unsafeJson({ error: error.message ?? "validation failed" }, { status: 400 }))
  }
  return withCors(HttpServerResponse.unsafeJson({ error: "Internal server error" }, { status: 500 }))
}

const readJsonBody = Effect.gen(function*() {
  const request = yield* HttpServerRequest.HttpServerRequest
  return (yield* Effect.orElseSucceed(request.json, () => ({}))) as Record<string, unknown>
})

export interface CreateWorkTimeRouterOptions {
  readonly authorizer: RequireAuthorization
}

/**
 * Worktime CRUD routes (mounted under /api by the server):
 * - POST /worktimes/arrival   — create entry (arrival time)
 * - PUT  /worktimes/departure — close the current user's open entry
 * - GET  /worktimes           — list own entries (all entries for admins)
 * All routes require authorization level 1 (as before).
 */
export const createWorkTimeRouter = (
  options: CreateWorkTimeRouterOptions
): HttpRouter.HttpRouter<never, HttpClient.HttpClient> => {
  const { authorizer } = options

  return HttpRouter.empty.pipe(
    HttpRouter.post(
      "/worktimes/arrival",
      authorizer(1)((user) =>
        Effect.gen(function*() {
          const open = yield* Effect.exit(Effect.tryPromise(() =>
            WorkTime.exists({ name: user.email, departure: { $exists: false } })
          ))
          if (open._tag === "Failure") {
            yield* logCause("worktime open entry lookup failed", open.cause)
            return mongooseError(Option.getOrUndefined(Cause.failureOption(open.cause)))
          }
          if (open.value) {
            return withCors(HttpServerResponse.unsafeJson({ error: "Already clocked in" }, { status: 409 }))
          }
          const outcome = yield* Effect.exit(
            Effect.tryPromise(() =>
              new WorkTime({ name: user.email, arrival: new Date() }).save()
            )
          )
          if (outcome._tag === "Failure") {
            const cause = Cause.failureOption(outcome.cause)
            yield* logCause("worktime arrival save failed", outcome.cause)
            return mongooseError(Option.getOrUndefined(cause))
          }
          const workTime = outcome.value
          return ok({ message: "Arrival time saved", id: String(workTime._id) })
        })
      )
    ),
    HttpRouter.put(
      "/worktimes/departure",
      authorizer(1)((user) =>
        Effect.gen(function*() {
          const outcome = yield* Effect.exit(
            Effect.tryPromise(() => WorkTime.findOneAndUpdate(
              { name: user.email, departure: { $exists: false } },
              { departure: new Date() },
              { new: true, sort: { arrival: -1 } }
            ).exec())
          )
          if (outcome._tag === "Failure") {
            yield* logCause("worktime departure lookup failed", outcome.cause)
            return mongooseError(Option.getOrUndefined(Cause.failureOption(outcome.cause)))
          }
          if (!outcome.value) {
            return withCors(
              HttpServerResponse.unsafeJson({ error: "No open work time" }, { status: 404 })
            )
          }
          return ok({ message: "Departure time saved", id: String(outcome.value._id) })
        })
      )
    ),
    HttpRouter.get(
      "/worktimes",
      authorizer(1)((user) =>
        Effect.gen(function*() {
          const outcome = yield* Effect.exit(Effect.tryPromise(() =>
            WorkTime.find(user.admin ? {} : { name: user.email }).sort({ arrival: -1 }).lean().exec()
          ))
          if (outcome._tag === "Failure") {
            yield* logCause("worktime list failed", outcome.cause)
            return mongooseError(Option.getOrUndefined(Cause.failureOption(outcome.cause)))
          }
          return ok(outcome.value)
        })
      )
    )
  )
}
