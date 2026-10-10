import { useEffect, useRef, useState } from "react"
import type { IntranetUser } from "./IntranetShell"

type AuthClient = { getToken: (key: string) => Promise<string>; setToken: (token: string) => void; getUser: () => Promise<IntranetUser>; logout: () => Promise<unknown> }
export function signInUrl(usersUrl: string, domain: string, path = window.location.pathname + window.location.search) {
  const url = new URL("/login", usersUrl)
  url.searchParams.set("domain", new URL(domain).host)
  const destination = new URL(path, domain)
  destination.searchParams.delete("user_key")
  url.searchParams.set("returnTo", destination.pathname + destination.search + destination.hash)
  return url.toString()
}
const readCookie = (name: string) => {
  const part = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))
  return part ? decodeURIComponent(part.slice(name.length + 1)) : ""
}
const clearCookie = (name: string) => { document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax` }
export function useServiceSession({ client, cookieName, usersUrl, domain, onUser, profileUrl }: { client: AuthClient; cookieName: string; usersUrl: string; domain: string; onUser?: (user: IntranetUser | null) => void; profileUrl?: string }) {
  const [user, setUser] = useState<IntranetUser | null | undefined>(undefined)
  const [error, setError] = useState("")
  const session = useRef<Promise<IntranetUser | null> | null>(null)
  useEffect(() => {
    let mounted = true
    if (!session.current) session.current = (async () => {
      const key = new URLSearchParams(window.location.search).get("user_key")
      const token = key ? await client.getToken(key) : readCookie(cookieName) || readCookie("usersToken")
      if (!token) return null
      client.setToken(token)
      const current = await client.getUser()
      if (profileUrl) {
        try {
          const response = await fetch(profileUrl, { headers: { Authorization: `bearer ${token}` } })
          if (response.ok) {
            const profile = await response.json()
            Object.assign(current, { firstname: profile.firstname, lastname: profile.lastname, admin: profile.admin })
          }
        } catch { /* Service authorization remains valid without the display profile. */ }
      }
      document.cookie = `${cookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=259200; SameSite=Lax`
      if (key) {
        const url = new URL(window.location.href)
        url.searchParams.delete("user_key")
        window.history.replaceState({}, "", url.pathname + url.search + url.hash)
      }
      return current
    })()
    session.current.then((current) => { if (mounted) { setUser(current); onUser?.(current) } }).catch((err) => {
      if (!mounted) return
      const status = err.response?.status
      if (status === 401 || status === 403) { clearCookie(cookieName); client.setToken(""); setUser(null); onUser?.(null) }
      else setError("Kirjautumistietoja ei voitu ladata. Päivitä sivu ja yritä uudelleen.")
    })
    return () => { mounted = false }
  }, [client, cookieName, domain, usersUrl, onUser, profileUrl])
  useEffect(() => { if (user === null) window.location.replace(signInUrl(usersUrl, domain)) }, [user, usersUrl, domain])
  const logout = async () => {
    try { await client.logout() } catch { /* Clear local credentials even if logout is unavailable. */ }
    for (const name of ["usersToken", "portalToken", "kuutioToken", "tyoaikaToken"]) clearCookie(name)
    client.setToken("")
    onUser?.(null)
    setUser(null)
  }
  return { user, ready: !!user, error, logout, loginUrl: signInUrl(usersUrl, domain) }
}
