import { Config, Effect } from "effect"
import type * as ConfigError from "effect/ConfigError"

export interface TyoaikaConfig {
  readonly port: number
  readonly environment: string
  readonly mongoUri: string
  readonly usersUrl: string
  readonly serviceName: string
  readonly serviceKey: string
}

/**
 * Server config from the environment (loaded via `node --env-file=.env`,
 * so no dotenv import is needed).
 *
 * - PORT         default 4004
 * - NODE_ENV     default "development"
 * - MONGODB_URI  default mongodb://localhost:27017/tyoaika-dev,
 *                falls back to legacy MONGO_URI
 * - USERS_URL    default http://localhost:4001
 * - SERVICE_NAME default tyoaika
 * - SERVICE_KEY  default dev-tyoaika-key-change-me (dev convenience)
 */
export const loadConfig: Effect.Effect<TyoaikaConfig, ConfigError.ConfigError> = Effect.gen(
  function*() {
    const port = yield* Config.integer("PORT").pipe(Config.withDefault(4004))
    const environment = yield* Config.string("NODE_ENV").pipe(Config.withDefault("development"))
    const mongoUri = yield* Config.string("MONGODB_URI").pipe(
      Config.orElse(() => Config.string("MONGO_URI")),
      Config.withDefault("mongodb://localhost:27017/tyoaika-dev")
    )
    const usersUrl = yield* Config.string("USERS_URL").pipe(
      Config.withDefault("http://localhost:4001")
    )
    const serviceName = yield* Config.string("SERVICE_NAME").pipe(Config.withDefault("tyoaika"))
    const serviceKey = yield* Config.string("SERVICE_KEY").pipe(
      Config.withDefault("dev-tyoaika-key-change-me")
    )
    return { port, environment, mongoUri, usersUrl, serviceName, serviceKey }
  }
)
