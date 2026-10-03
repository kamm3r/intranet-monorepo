import { randomBytes } from "node:crypto"
import { readFileSync, writeFileSync, unlinkSync } from "node:fs"
import bcrypt from "bcrypt"
import mongoose from "mongoose"
import Service from "../models/service.js"
import User from "../models/user.js"

const credentialsPath = process.env.INTRANET_DEMO_CREDENTIALS ?? "/tmp/intranet-demo-credentials.json"
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/users-dev"
const mongoHost = new URL(mongoUri).hostname
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(mongoHost)) {
  throw new Error("Demo setup is allowed only with a local development database")
}

const serviceKey = (app: string): string => {
  const source = readFileSync(new URL(`../../${app}/.env`, import.meta.url), "utf8")
  const key = source.match(/^SERVICE_KEY=(.+)$/m)?.[1]?.trim()
  if (!key) throw new Error(`SERVICE_KEY missing in ${app}/.env`)
  return key
}

const services = [
  { name: "portal", domain: "localhost:5172", protocol: "http", serviceKey: serviceKey("portal-api") },
  { name: "kuutio", domain: "localhost:5175", protocol: "http", serviceKey: serviceKey("kuutio-api") },
  { name: "tyoaika", domain: "localhost:5176", protocol: "http", serviceKey: serviceKey("tyoaika-api") },
]

try {
  await mongoose.connect(mongoUri)
  if (process.argv.includes("--cleanup")) {
    const credentials = JSON.parse(readFileSync(credentialsPath, "utf8")) as { email: string }
    await User.deleteOne({ email: credentials.email })
    unlinkSync(credentialsPath)
    process.stdout.write("Disposable demo account removed.\n")
  } else {
    const records = []
    for (const item of services) {
      const existing = await Service.findOne({ name: item.name })
      if (existing) {
        if (existing.domain !== item.domain || existing.serviceKey !== item.serviceKey) {
          throw new Error(`Existing ${item.name} service does not match the local app configuration`)
        }
        records.push(existing)
      } else {
        records.push(await Service.create(item))
      }
    }
    const email = `recording-${randomBytes(5).toString("hex")}@example.test`
    const password = randomBytes(24).toString("base64url")
    await User.create({
      email,
      firstname: "Demo",
      lastname: "User",
      passwordHash: await bcrypt.hash(password, 12),
      admin: true,
      access: records.map((service) => ({ service: service._id, name: service.name, level: 3 })),
    })
    writeFileSync(credentialsPath, JSON.stringify({ email, password }, null, 2), { mode: 0o600 })
    process.stdout.write(`Local services and disposable account ready. Credentials: ${credentialsPath}\n`)
  }
} finally {
  await mongoose.disconnect()
}
