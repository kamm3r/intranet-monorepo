// @intranet/users-api entrypoint.
//
// Run with `tsx watch --env-file=.env index.ts` (dev) or
// `node --env-file=.env dist/index.js` (prod build output).
import { Effect, Layer } from "effect"
import { HttpServer } from "@effect/platform"
import { NodeHttpClient, NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"

import { appConfigEffect } from "./config.js"
import { connectMongooseEffect } from "./connectMongoose.js"
import { buildRouter } from "./app.js"

const main = Effect.gen(function* () {
  // Validated load via Effect Config (PORT, MONGODB_URI variants, secrets…).
  const config = yield* appConfigEffect

  // Connect in the background like the legacy app (which never awaited the
  // connection): the server listens even when Mongo is still unreachable,
  // and success/failure is logged when it settles.
  yield* Effect.forkDaemon(connectMongooseEffect(config.mongoUrl))

  const httpLive = Layer.mergeAll(
    NodeHttpServer.layer(() => createServer(), { port: config.port }),
    NodeHttpClient.layer
  )
  const appLive = Layer.provide(HttpServer.serve(buildRouter()), httpLive)

  yield* Effect.sync(() => {
    console.log(`@intranet/users-api running on port: ${config.port}`)
  })
  yield* Layer.launch(appLive)
})

main.pipe(NodeRuntime.runMain)
