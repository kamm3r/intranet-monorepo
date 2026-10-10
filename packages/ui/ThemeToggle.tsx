import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "./components/button"

type Theme = "light" | "dark"
// Cookies ignore ports, so every app on the same host shares one theme choice.
const cookieName = "intranetTheme"

const storedTheme = (): Theme | null => {
  const value = document.cookie.split("; ").find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  return value === "light" || value === "dark" ? value : null
}
const systemTheme = (): Theme => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
}

// Apply before the first render to avoid a light flash in dark mode.
if (typeof document !== "undefined") applyTheme(storedTheme() ?? systemTheme())

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? systemTheme())
  useEffect(() => {
    applyTheme(theme)
    if (storedTheme()) return
    // Follow the operating system until the user picks a theme explicitly.
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const follow = () => setTheme(systemTheme())
    media.addEventListener("change", follow)
    return () => media.removeEventListener("change", follow)
  }, [theme])
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    document.cookie = `${cookieName}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
    setTheme(next)
  }
  const label = theme === "dark" ? "Vaihda vaaleaan teemaan" : "Vaihda tummaan teemaan"
  return <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
    {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
  </Button>
}
