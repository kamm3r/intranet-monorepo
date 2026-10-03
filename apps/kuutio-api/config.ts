// Central configuration for @intranet/kuutio-api.
//
// Primary runtime path is Effect Config (`appConfigEffect`, used at boot in
// index.ts). The synchronous mirrors below read the same env vars and exist
// for non-Effect contexts. Node >=22 loads `.env` via `--env-file=.env`, so
// no dotenv is needed.
//
// Canonical vars first, legacy `_DEV`/`_PROD` suffixed vars as fallback.
import { Config, ConfigError, Effect, Option } from "effect"

export const portConfig = Config.integer("PORT").pipe(Config.withDefault(4003))
export const nodeEnvConfig = Config.string("NODE_ENV").pipe(Config.withDefault("development"))

export interface KuutioConfig {
  port: number
  environment: string
  mongoUri: string
  usersUrl: string
  serviceName: string
  serviceKey: string
}

const pick = (
  primary: Option.Option<string>,
  fallback: Option.Option<string>,
  def: string
): string => Option.getOrElse(primary, () => Option.getOrElse(fallback, () => def))

const noneString: Option.Option<string> = Option.none()

/** Validated, Effect-Config-based load of the full configuration. */
export const appConfigEffect: Effect.Effect<KuutioConfig, ConfigError.ConfigError> = Effect.gen(function* () {
  const port = yield* portConfig
  const environment = yield* nodeEnvConfig
  const isProduction = environment === "production"

  const mongoUri = yield* Config.option(Config.string("MONGODB_URI"))
  const mongoLegacy = yield* Config.option(
    Config.string(isProduction ? "MONGODB_URI_PROD" : "MONGODB_URI_DEV")
  )

  const usersUrl = yield* Config.option(Config.string("USERS_URL"))
  const usersLegacy = yield* Config.option(
    Config.string(isProduction ? "USERS_URL_PROD" : "USERS_URL_DEV")
  )

  const serviceName = yield* Config.option(Config.string("SERVICE_NAME"))
  const serviceNameLegacy = yield* Config.option(Config.string("SERVICE_NAME_DEV"))

  const serviceKey = yield* Config.option(Config.string("SERVICE_KEY"))
  const serviceKeyLegacy = yield* Config.option(
    Config.string(isProduction ? "SERVICE_KEY_PROD" : "SERVICE_KEY_DEV")
  )

  return {
    port,
    environment,
    mongoUri: pick(mongoUri, mongoLegacy, ""),
    usersUrl: pick(usersUrl, usersLegacy, ""),
    serviceName: pick(serviceName, serviceNameLegacy, "kuutio"),
    serviceKey: pick(serviceKey, serviceKeyLegacy, "")
  }
})

// ---- Synchronous mirrors (same vars/defaults; for non-Effect contexts) ----

export const environment = process.env.NODE_ENV ?? "development"
const isProduction = environment === "production"

export const PORT = Number(process.env.PORT ?? 4003)

export const MONGODB_URI =
  process.env.MONGODB_URI ??
  (isProduction ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI_DEV) ??
  ""

export const USERS_URL =
  process.env.USERS_URL ??
  (isProduction ? process.env.USERS_URL_PROD : process.env.USERS_URL_DEV) ??
  ""

export const SERVICE_NAME =
  process.env.SERVICE_NAME ?? process.env.SERVICE_NAME_DEV ?? "kuutio"

export const SERVICE_KEY =
  process.env.SERVICE_KEY ??
  (isProduction ? process.env.SERVICE_KEY_PROD : process.env.SERVICE_KEY_DEV) ??
  ""

export default { environment, PORT, MONGODB_URI, USERS_URL, SERVICE_NAME, SERVICE_KEY }
