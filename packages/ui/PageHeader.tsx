import type { ReactNode } from "react"
import { CircleAlert, LoaderCircle } from "lucide-react"

// The shared page heading keeps titles, descriptions, and actions aligned across apps.
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div className="min-w-0 max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
}

export function PageContainer({ children, width = "default" }: { children: ReactNode; width?: "narrow" | "default" | "wide" }) {
  const max = width === "narrow" ? "max-w-3xl" : width === "wide" ? "max-w-7xl" : "max-w-6xl"
  return <main className={`mx-auto w-full min-w-0 ${max} px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8`}>{children}</main>
}

// Session loading and failure share one calm, centered treatment in every app.
export function PageStatus({ error, children = "Ladataan käyttäjätietoja…" }: { error?: string; children?: ReactNode }) {
  return <main className="flex flex-1 items-center justify-center p-6">
    <p role={error ? "alert" : "status"} className={`flex max-w-md items-center gap-2 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
      {error ? <CircleAlert className="size-4 shrink-0" aria-hidden="true" /> : <LoaderCircle className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {error || children}
    </p>
  </main>
}
