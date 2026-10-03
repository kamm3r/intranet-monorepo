// users-api HTTP app: Effect HttpRouter composition (replaces Express).
//
// Routes are defined with full paths in their controller modules and
// concatenated here. CORS headers are attached per response (see
// middleware/middleware.ts); preflight is answered by the catch-all.
//
// In production the built users-web client (sibling ../users-web/dist) is
// served for non-API GETs, mirroring the legacy express.static behaviour.
// When the dist directory is absent the server is API-only.
import { Effect } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, statSync } from "node:fs"

import authenticateRouter from "./controllers/authenticateRouter.js"
import authorizeRouter from "./controllers/authorizeRouter.js"
import userRouter from "./controllers/userRouter.js"
import serviceRouter from "./controllers/serviceRouter.js"
import passwordResetRouter from "./controllers/passwordResetRouter.js"
import {
  emptyResponse,
  errorValue,
  htmlResponse,
  jsonResponse,
  logRequest,
  withCors
} from "./middleware/middleware.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webDist = path.join(__dirname, "../users-web/dist")

// Api information message.
const apiInfo = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  yield* logRequest(req)
  return yield* htmlResponse("<h1>Backend API starts here</h1> ")
})

const serveFileResponse = (filePath: string) =>
  HttpServerResponse.file(filePath).pipe(
    Effect.map(withCors),
    Effect.orElseSucceed(() => errorValue(404, { error: "not found" }))
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
    return yield* jsonResponse({ error: "not found" }, 404)
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

  return yield* jsonResponse({ error: "not found" }, 404)
})

export const buildRouter = () =>
  HttpRouter.empty.pipe(
    HttpRouter.get("/api", apiInfo),
    HttpRouter.concat(authenticateRouter),
    HttpRouter.concat(authorizeRouter),
    HttpRouter.concat(userRouter),
    HttpRouter.concat(serviceRouter),
    HttpRouter.concat(passwordResetRouter),
    HttpRouter.all("*", fallback)
  )

export default buildRouter
