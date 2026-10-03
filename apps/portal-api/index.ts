import * as Http from "node:http"
import * as Path from "node:path"
import { Effect, Layer } from "effect"
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { NodeHttpClient, NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import {
  corsPreflight,
  createAuthorizeRouter,
  createRequireAuthorization,
  withCors
} from "@intranet/auth-server"
import { loadConfig } from "./config.js"

// Web bundle lives next to this package (`../portal-web/dist`). When running
// from compiled output the module sits one level deeper (`dist/`), so step
// out of it to find the package root. Works for both `tsx index.ts` (dev)
// and `node dist/index.js` (start).
const apiRoot = Path.basename(import.meta.dirname) === "dist"
  ? Path.join(import.meta.dirname, "..")
  : import.meta.dirname
const distDir = Path.join(apiRoot, "..", "portal-web", "dist")

/**
 * Serves the built portal-web client (production only).
 * Falls back to index.html for SPA routes; 404s when the
 * dist bundle (or the file) does not exist.
 */
const serveDistFile = Effect.gen(function*() {
  const request = yield* HttpServerRequest.HttpServerRequest
  const pathname = new URL(request.url, "http://localhost").pathname
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "")
  const candidate = Path.normalize(Path.join(distDir, relative))
  const safe =
    candidate === distDir || candidate.startsWith(distDir + Path.sep)
      ? candidate
      : Path.join(distDir, "index.html")
  const response = yield* HttpServerResponse.file(safe).pipe(
    Effect.catchAll(() => HttpServerResponse.file(Path.join(distDir, "index.html"))),
    Effect.catchAll(() => Effect.succeed(withCors(HttpServerResponse.text("not found", { status: 404 }))))
  )
  return withCors(response)
})

const program = Effect.gen(function*() {
  const config = yield* loadConfig

  // Portal has no service name of its own: authorization is checked
  // against the plain /api/authorize endpoint (as before).
  const requireAuthorization = createRequireAuthorization({ usersUrl: config.usersUrl })
  const authorizeApi = createAuthorizeRouter({
    serviceKey: config.serviceKey,
    requiredLevel: 1,
    authorizer: requireAuthorization
  })

  // NOTE: no wildcard OPTIONS route — registering the same wildcard path
  // via both `all` and `route("OPTIONS")` breaks find-my-way route building.
  // Browsers preflight concrete URLs, so per-path OPTIONS routes suffice.
  const routerBase = HttpRouter.empty.pipe(
    HttpRouter.get(
      "/api",
      Effect.succeed(withCors(HttpServerResponse.html("<h4> The API starts here. </h4>")))
    ),
    HttpRouter.mount("/api/authorize", authorizeApi),
    HttpRouter.route("OPTIONS")("/api", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/authorize", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/authorize/:key", corsPreflight),
    HttpRouter.all(
      "/api/*",
      Effect.succeed(
        withCors(HttpServerResponse.unsafeJson({ error: "unknown endpoint" }, { status: 404 }))
      )
    )
  )

  const router =
    config.environment === "production"
      ? routerBase.pipe(HttpRouter.get("/*", serveDistFile))
      : routerBase

  const ServerLive = NodeHttpServer.layer(() => Http.createServer(), { port: config.port })
  const HttpLive = HttpServer.serve(router).pipe(
    Layer.provide(ServerLive),
    Layer.provide(NodeHttpClient.layer)
  )

  yield* Effect.logInfo(`intranet-portal server running on port: ${config.port}`)
  yield* Layer.launch(HttpLive)
})

NodeRuntime.runMain(program)
