import { Config, Effect } from "effect"
import type * as ConfigError from "effect/ConfigError"

export interface PortalConfig {
  readonly port: number
  readonly environment: string
  readonly usersUrl: string
  readonly serviceKey: string
}

/**
 * Server config from the environment (loaded via `node --env-file=.env`,
 * so no dotenv import is needed).
 *
 * - PORT        default 4002
 * - NODE_ENV    default "development"
 * - USERS_URL   default http://localhost:4001
 * - SERVICE_KEY default dev-portal-key-change-me (dev convenience)
 */
export const loadConfig: Effect.Effect<PortalConfig, ConfigError.ConfigError> = Effect.gen(function*() {
  const port = yield* Config.integer("PORT").pipe(Config.withDefault(4002))
  const environment = yield* Config.string("NODE_ENV").pipe(Config.withDefault("development"))
  const usersUrl = yield* Config.string("USERS_URL").pipe(
    Config.withDefault("http://localhost:4001")
  )
  const serviceKey = yield* Config.string("SERVICE_KEY").pipe(
    Config.withDefault("dev-portal-key-change-me")
  )
  return { port, environment, usersUrl, serviceKey }
})
