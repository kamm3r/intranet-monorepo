// Service registry routes.
//
// GET    /api/services/public — public service info (open)
// GET    /api/services        — full service info (auth + admin)
// POST   /api/services        — add a service (auth + admin)
// DELETE /api/services/:id   — delete a service (auth + admin)
// PUT    /api/services/:id   — update a service (auth + admin)
import { Effect } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"

import Service from "../models/service.js"
import { authenticateRequest, requireAdmin, type AuthUser } from "../middleware/authorize.js"
import {
  errorValue,
  jsonResponse,
  logBody,
  logRequest,
  mongooseErrorValue,
  orResponse,
  readJsonBody
} from "../middleware/middleware.js"

const dbError = (error: unknown): HttpServerResponse.HttpServerResponse =>
  mongooseErrorValue(error) ?? errorValue(500, { error: "something went wrong..." })

const authAdmin = (
  req: HttpServerRequest.HttpServerRequest
): Effect.Effect<AuthUser | HttpServerResponse.HttpServerResponse> =>
  authenticateRequest(req).pipe(
    Effect.flatMap((auth) => {
      if (HttpServerResponse.isServerResponse(auth)) return Effect.succeed(auth)
      const adminError = requireAdmin(auth)
      if (adminError) {
        return Effect.succeed<AuthUser | HttpServerResponse.HttpServerResponse>(adminError)
      }
      return Effect.succeed<AuthUser | HttpServerResponse.HttpServerResponse>(auth)
    })
  )

// Get all public information about the services.
const getPublicServices = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const services = yield* orResponse(
    Effect.tryPromise({
      try: () => Service.find({}).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(services)) return services

  return yield* jsonResponse(services.map(Service.format))
})

// Get all information about each service.
const getAllServices = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authAdmin(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const services = yield* orResponse(
    Effect.tryPromise({
      try: () => Service.find({}).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(services)) return services

  return yield* jsonResponse(services)
})

// An admin user can add a new domain to the system.
const createService = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authAdmin(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  let name = typeof maybeBody.name === "string" ? maybeBody.name : undefined
  let domain = typeof maybeBody.domain === "string" ? maybeBody.domain : undefined
  let protocol = typeof maybeBody.protocol === "string" ? maybeBody.protocol : undefined
  const serviceKey = typeof maybeBody.serviceKey === "string" ? maybeBody.serviceKey : undefined

  if (!name) return yield* jsonResponse({ error: "name is missing" }, 400)
  if (!domain) return yield* jsonResponse({ error: "domain is missing" }, 400)
  if (!protocol) return yield* jsonResponse({ error: "protocol is missing" }, 400)
  if (!serviceKey) return yield* jsonResponse({ error: "serviceKey is missing" }, 400)

  name = name.toLowerCase()
  domain = domain.toLowerCase()
  protocol = protocol.toLowerCase()

  const service = new Service({ name, domain, protocol, serviceKey })

  const saved = yield* orResponse(
    Effect.tryPromise({
      try: () => service.save(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(saved)) return saved

  return yield* jsonResponse(Service.format(saved))
})

// An admin user can delete a service.
const deleteService = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authAdmin(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const deleted = yield* orResponse(
    Effect.tryPromise({
      try: () => Service.findByIdAndDelete(id).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(deleted)) return deleted
  if (!deleted) {
    return yield* jsonResponse({ error: "service does not exist" }, 400)
  }

  return yield* jsonResponse(Service.format(deleted))
})

// An admin user can update a service.
const updateService = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  const auth = yield* authAdmin(req)
  if (HttpServerResponse.isServerResponse(auth)) return auth

  const params = yield* HttpRouter.params
  const id = params.id ?? ""

  const maybeBody = yield* readJsonBody(req)
  if (HttpServerResponse.isServerResponse(maybeBody)) return maybeBody
  yield* logBody(maybeBody)

  let name = typeof maybeBody.name === "string" ? maybeBody.name : undefined
  let domain = typeof maybeBody.domain === "string" ? maybeBody.domain : undefined
  let protocol = typeof maybeBody.protocol === "string" ? maybeBody.protocol : undefined
  const serviceKey = typeof maybeBody.serviceKey === "string" ? maybeBody.serviceKey : undefined

  if (!name && !domain && !protocol && !serviceKey) {
    return yield* jsonResponse({ error: "no fields provided for editing." }, 400)
  }

  if (name) name = name.toLowerCase()
  if (domain) domain = domain.toLowerCase()
  if (protocol) protocol = protocol.toLowerCase()

  const updated = yield* orResponse(
    Effect.tryPromise({
      try: () =>
        Service.findByIdAndUpdate(id, { name, domain, protocol, serviceKey }, { new: true }).exec(),
      catch: (error) => error
    }).pipe(Effect.mapError(dbError))
  )
  if (HttpServerResponse.isServerResponse(updated)) return updated
  if (!updated) {
    return yield* jsonResponse({ error: "service does not exist" }, 400)
  }

  return yield* jsonResponse(updated)
})

export const serviceRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/services/public", getPublicServices),
  HttpRouter.get("/api/services", getAllServices),
  HttpRouter.post("/api/services", createService),
  HttpRouter.del("/api/services/:id", deleteService),
  HttpRouter.put("/api/services/:id", updateService)
)

export default serviceRouter
