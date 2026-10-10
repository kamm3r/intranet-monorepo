import { LogIn, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

const DAILY_TARGET_MINUTES = 8 * 60

export function workDuration(minutes: number) {
  const total = Math.max(0, Math.floor(minutes))
  return `${Math.floor(total / 60)} h ${total % 60} min`
}

export function workBalance(minutes: number) {
  const balance = Math.floor(minutes) - DAILY_TARGET_MINUTES
  const absolute = Math.abs(balance)
  return `${balance > 0 ? "+" : balance < 0 ? "−" : "±"}${Math.floor(absolute / 60)}:${String(absolute % 60).padStart(2, "0")}`
}

export function WorkTimeProgress({ minutes, active, ready, saving, completed, onStamp }: {
  minutes: number
  active: boolean
  ready: boolean
  saving: boolean
  completed: boolean
  onStamp: () => void
}) {
  const progress = Math.min(100, Math.max(0, minutes / DAILY_TARGET_MINUTES * 100))
  const wholeMinutes = Math.max(0, Math.floor(minutes))
  const action = saving ? "Tallennetaan…" : active ? "Leimaa ulos" : "Leimaa sisään"
  const showBalance = ready && !active && completed
  const balance = wholeMinutes - DAILY_TARGET_MINUTES
  const balanceLabel = balance > 0 ? "Yliaika" : balance < 0 ? "Aliaika" : "Tavoite täynnä"
  const StampIcon = active ? LogOut : LogIn

  return <div className="flex w-full min-w-0 flex-col items-center gap-3">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" onClick={onStamp} disabled={!ready || saving} aria-label={action} aria-busy={saving} aria-description={ready ? `Työaika tänään ${workDuration(minutes)}. Päivätavoite 8 tuntia.` : "Kirjaudu sisään tai odota työaikatietojen lataamista."} className="work-stamp relative aspect-square h-auto w-44 max-w-full shrink-0 rounded-full p-0 hover:bg-transparent sm:w-48">
          <span className="work-stamp-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
          <svg viewBox="0 0 180 180" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="90" cy="90" r="84" fill="none" strokeWidth="5" className="stroke-border" />
            <circle cx="90" cy="90" r="84" fill="none" strokeWidth="5" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (ready ? progress : 0)} strokeLinecap={progress > 0 ? "round" : "butt"} className={`work-stamp-progress ${minutes > DAILY_TARGET_MINUTES ? "stroke-amber-600" : "stroke-emerald-600"}`} />
          </svg>
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="font-display text-[2.75rem] font-medium tabular-nums">{ready ? `${String(Math.floor(wholeMinutes / 60)).padStart(2, "0")}:${String(wholeMinutes % 60).padStart(2, "0")}` : "–:–"}</span>
            <StampIcon className={`size-4 ${active ? "text-emerald-600" : "text-muted-foreground"}`} aria-hidden="true" />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{action}</TooltipContent>
    </Tooltip>
    {showBalance && <p role="status" aria-label={`${balanceLabel} ${workDuration(Math.abs(balance))}`} title={`${balanceLabel} · päivän tavoite 8 h`} className={`text-sm font-medium tabular-nums ${balance > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{workBalance(minutes)}</p>}
  </div>
}
