// Central configuration for @intranet/users-api.
//
// Primary runtime path is Effect Config (`appConfigEffect`, used at boot in
// index.ts for PORT + MONGODB_URI validation/selection). The synchronous
// mirrors below read the same env vars and exist for contexts where an
// Effect cannot run (Mongoose model methods such as `generateJWT`, the
// in-memory token-blacklist prune). Node >=22 loads `.env` via
// `--env-file=.env`, so no dotenv is needed.
import { Config, ConfigError, Effect, Option } from "effect"

export const portConfig = Config.integer("PORT").pipe(Config.withDefault(4001))
export const nodeEnvConfig = Config.string("NODE_ENV").pipe(Config.withDefault("development"))

export interface AppConfig {
  port: number
  mongoUrl: string
  secret: string
  email: string
  emailPW: string
  url: string
  clientUrl: string
  environment: string
}

const pick = (
  primary: Option.Option<string>,
  fallback: Option.Option<string>,
  def: string
): string => Option.getOrElse(primary, () => Option.getOrElse(fallback, () => def))

const noneString: Option.Option<string> = Option.none()

/** Validated, Effect-Config-based load of the full app configuration. */
export const appConfigEffect: Effect.Effect<AppConfig, ConfigError.ConfigError> = Effect.gen(function* () {
  const port = yield* portConfig
  const environment = yield* nodeEnvConfig

  const mongoUri = yield* Config.option(Config.string("MONGODB_URI"))
  const testUri = yield* Config.option(Config.string("TEST_MONGODB_URI"))
  const prodUri = yield* Config.option(Config.string("PRODUCTION_MONGODB_URI"))

  const jwtSecret = yield* Config.option(Config.string("JWT_SECRET"))
  const legacySecret = yield* Config.option(Config.string("SECRET"))

  const email = yield* Config.option(Config.string("SERVICE_EMAIL"))
  const appKey = yield* Config.option(Config.string("APP_KEY"))
  const legacyAppKey = yield* Config.option(Config.string("SERVICE_EMAIL_APP_KEY"))

  const url = yield* Config.option(Config.string("URL"))
  const clientUrl = yield* Config.option(Config.string("CLIENT_URL"))

  let mongoUrl = pick(mongoUri, noneString, "mongodb://localhost:27017/users-dev")
  if (environment === "test") {
    mongoUrl = pick(testUri, mongoUri, "mongodb://localhost:27017/users-test")
  } else if (environment === "production") {
    mongoUrl = pick(prodUri, mongoUri, "mongodb://localhost:27017/users-prod")
  }

  return {
    port,
    mongoUrl,
    secret: pick(jwtSecret, legacySecret, "dev-jwt-secret-change-me"),
    email: pick(email, noneString, ""),
    emailPW: pick(appKey, legacyAppKey, ""),
    url: pick(url, noneString, "http://localhost:4001"),
    clientUrl: pick(clientUrl, url, "http://localhost:5171"),
    environment
  }
})

// ---- Synchronous mirrors (same vars/defaults; for Mongoose + sync contexts) ----

export const environment = process.env.NODE_ENV ?? "development"

export const port = Number(process.env.PORT ?? 4001)

export const email = process.env.SERVICE_EMAIL ?? ""
export const emailPW = process.env.APP_KEY ?? process.env.SERVICE_EMAIL_APP_KEY ?? ""

export const url = process.env.URL ?? "http://localhost:4001"
export const clientUrl = process.env.CLIENT_URL ?? process.env.URL ?? "http://localhost:5171"

let syncMongoUrl = process.env.MONGODB_URI ?? "mongodb://localhost:27017/users-dev"
if (environment === "test") {
  syncMongoUrl =
    process.env.TEST_MONGODB_URI ??
    process.env.MONGODB_URI ??
    "mongodb://localhost:27017/users-test"
} else if (environment === "production") {
  syncMongoUrl =
    process.env.PRODUCTION_MONGODB_URI ??
    process.env.MONGODB_URI ??
    "mongodb://localhost:27017/users-prod"
}
export const mongoUrl = syncMongoUrl

export const secret = process.env.JWT_SECRET ?? process.env.SECRET ?? "dev-jwt-secret-change-me"

// Backwards-compatible aliases
export const serviceEmail = email
export const appKey = emailPW
export const jwtSecret = secret

/** Sync secret access for jsonwebtoken calls inside Mongoose methods. */
export const getJwtSecretSync = (): string =>
  process.env.JWT_SECRET ?? process.env.SECRET ?? "dev-jwt-secret-change-me"

export default {
  mongoUrl,
  port,
  email,
  emailPW,
  url,
  clientUrl,
  environment,
  secret,
  serviceEmail,
  appKey,
  jwtSecret
}
