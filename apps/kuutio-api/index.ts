// @intranet/kuutio-api entrypoint.
//
// Run with `tsx watch --env-file=.env index.ts` (dev) or
// `node --env-file=.env dist/index.js` (prod build output).
import { Effect, Layer } from "effect"
import { HttpServer } from "@effect/platform"
import { NodeHttpClient, NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"
import mongoose from "mongoose"

import { appConfigEffect } from "./config.js"
import { logger } from "./middleware/middleware.js"
import { buildRouter } from "./app.js"

const connectDatabase = (mongoUri: string): Effect.Effect<void> =>
  Effect.zipRight(
    Effect.sync(() => {
      console.log("connecting to MongoDB")
    }),
    Effect.tryPromise({
      try: () =>
        mongoose.connect(mongoUri).then((): void => {
          undefined
        }),
      catch: (error) => error
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          console.log("Kuutio app connected to database")
        })
      ),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          logger.error("Error connecting to database:", error)
        })
      )
    )
  )

const main = Effect.gen(function* () {
  // Validated load via Effect Config (PORT, MONGODB_URI, USERS_URL, …).
  const config = yield* appConfigEffect

  // Connect in the background so the server listens even when Mongo is
  // still unreachable (legacy kuutio gated listen on connect; the Effect
  // port starts unconditionally and logs the connection outcome).
  yield* Effect.forkDaemon(connectDatabase(config.mongoUri))

  const httpLive = Layer.mergeAll(
    NodeHttpServer.layer(() => createServer(), { port: config.port }),
    NodeHttpClient.layer
  )
  const appLive = Layer.provide(HttpServer.serve(buildRouter()), httpLive)

  yield* Effect.sync(() => {
    logger.info(`Kuutio app is listening to port: ${config.port}`)
  })
  yield* Layer.launch(appLive)
})

main.pipe(NodeRuntime.runMain)
