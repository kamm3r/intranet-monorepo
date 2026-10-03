// kuutio-api HTTP app: Effect HttpRouter composition (replaces Express).
//
// In production the built kuutio-web client (sibling ../kuutio-web/dist) is
// served for non-API GETs, mirroring the legacy express.static behaviour.
// When the dist directory is absent the server is API-only.
import { Effect } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, statSync } from "node:fs"

import bookingRoute from "./routes/bookingRoute.js"
import authorizeRouter from "./routes/authorizeRouter.js"
import {
  emptyResponse,
  errorValue,
  jsonResponse,
  logRequest,
  textResponse,
  withCors
} from "./middleware/middleware.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webDist = path.join(__dirname, "../kuutio-web/dist")

const welcome = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)
  return yield* textResponse("Welcome to kuutio booking.")
})

const serveFileResponse = (filePath: string) =>
  HttpServerResponse.file(filePath).pipe(
    Effect.map(withCors),
    Effect.orElseSucceed(() => errorValue(404, { error: "unknown endpoint" }))
  )

const safeRelative = (urlPath: string): string => {
  try {
    return decodeURIComponent(urlPath).replace(/^\/+/, "")
  } catch {
    return ""
  }
}

// Catch-all: CORS preflight, /api unknown endpoints, frontend static files.
const fallback = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)

  if (req.method === "OPTIONS") return yield* emptyResponse(204)

  const urlPath = req.url.split("?")[0].split("#")[0] || "/"

  if (urlPath === "/api" || urlPath.startsWith("/api/")) {
    return yield* jsonResponse({ error: "unknown endpoint" }, 404)
  }

  if (req.method !== "GET") {
    return yield* jsonResponse({ error: "unknown endpoint" }, 404)
  }

  const candidate = path.normalize(path.join(webDist, safeRelative(urlPath)))
  if (urlPath !== "/" && !candidate.startsWith(webDist)) {
    return yield* jsonResponse({ error: "unknown endpoint" }, 404)
  }

  if (urlPath !== "/") {
    try {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return yield* serveFileResponse(candidate)
      }
    } catch {
      // Fall through to index.html.
    }
  }

  const indexFile = path.join(webDist, "index.html")
  try {
    if (existsSync(indexFile) && statSync(indexFile).isFile()) {
      return yield* serveFileResponse(indexFile)
    }
  } catch {
    // Fall through to 404 JSON.
  }

  return yield* jsonResponse({ error: "unknown endpoint" }, 404)
})

export const buildRouter = () =>
  HttpRouter.empty.pipe(
    HttpRouter.get("/", welcome),
    HttpRouter.concat(bookingRoute),
    HttpRouter.concat(authorizeRouter),
    HttpRouter.all("*", fallback)
  )

export default buildRouter
