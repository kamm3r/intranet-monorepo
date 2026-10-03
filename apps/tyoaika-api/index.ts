import * as Http from "node:http"
import * as Path from "node:path"
import mongoose from "mongoose"
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
import { createWorkTimeRouter } from "./routes/workTimes.js"

// Web bundle lives next to this package (`../tyoaika-web/dist`). When running
// from compiled output the module sits one level deeper (`dist/`), so step
// out of it to find the package root. Works for both `tsx index.ts` (dev)
// and `node dist/index.js` (start).
const apiRoot = Path.basename(import.meta.dirname) === "dist"
  ? Path.join(import.meta.dirname, "..")
  : import.meta.dirname
const distDir = Path.join(apiRoot, "..", "tyoaika-web", "dist")

/**
 * Serves the built tyoaika-web client (production only).
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

  yield* Effect.tryPromise({
    try: () => mongoose.connect(config.mongoUri),
    catch: (error) =>
      new Error(
        `Virhe tietokantaan yhdistäessä: ${error instanceof Error ? error.message : String(error)}`
      )
  })
  yield* Effect.logInfo("Työaikakirjaus-appi yhdistetty tietokantaan")

  const requireAuthorization = createRequireAuthorization({
    usersUrl: config.usersUrl,
    serviceName: config.serviceName
  })
  const authorizeApi = createAuthorizeRouter({
    serviceKey: config.serviceKey,
    requiredLevel: 1,
    authorizer: requireAuthorization
  })
  const workTimeApi = createWorkTimeRouter({ authorizer: requireAuthorization })

  // NOTE: no wildcard OPTIONS route — registering the same wildcard path
  // via both `all` and `route("OPTIONS")` breaks find-my-way route building.
  // Browsers preflight concrete URLs, so per-path OPTIONS routes suffice.
  const routerBase = HttpRouter.empty.pipe(
    HttpRouter.get(
      "/",
      Effect.succeed(withCors(HttpServerResponse.text("Tervetuloa Työaikakirjaus.")))
    ),
    HttpRouter.mount("/api/authorize", authorizeApi),
    HttpRouter.mount("/api", workTimeApi),
    HttpRouter.route("OPTIONS")("/api", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/authorize", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/authorize/:key", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/worktimes", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/worktimes/arrival", corsPreflight),
    HttpRouter.route("OPTIONS")("/api/worktimes/departure", corsPreflight),
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

  yield* Effect.logInfo(`Työaikakirjaus-appi kuuntelee porttia: ${config.port}`)
  yield* Layer.launch(HttpLive)
})

NodeRuntime.runMain(program)
