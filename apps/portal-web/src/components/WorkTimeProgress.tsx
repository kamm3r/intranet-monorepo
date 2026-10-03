const DAILY_TARGET_MINUTES = 8 * 60

export function workDuration(minutes: number) {
  const total = Math.max(0, Math.floor(minutes))
  return `${Math.floor(total / 60)} h ${total % 60} min`
}

export function WorkTimeProgress({ minutes, active, ready }: { minutes: number; active: boolean; ready: boolean }) {
  const progress = Math.min(100, Math.max(0, minutes / DAILY_TARGET_MINUTES * 100))
  const overtime = minutes >= DAILY_TARGET_MINUTES
  const difference = Math.abs(minutes - DAILY_TARGET_MINUTES)
  const label = overtime ? "Yliaika" : active ? "Tavoitteeseen jäljellä" : "Aliaika"
  const wholeMinutes = Math.max(0, Math.floor(minutes))

  return <div className="flex w-full min-w-0 flex-col items-center gap-2">
    <div className="relative aspect-square w-32 max-w-full sm:w-36" role="progressbar" aria-label="Päivän työaikatavoite" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ready ? Math.round(progress) : 0} aria-valuetext={ready ? `${workDuration(minutes)}, tavoite 8 tuntia, ${label.toLowerCase()} ${workDuration(difference)}` : "Työaikaa ladataan"}>
      <svg viewBox="0 0 180 180" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r="84" fill="none" strokeWidth="6" className="stroke-border" />
        <circle cx="90" cy="90" r="84" fill="none" strokeWidth="6" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (ready ? progress : 0)} strokeLinecap={progress > 0 ? "round" : "butt"} className={overtime ? "stroke-amber-600" : "stroke-emerald-600"} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-xs text-muted-foreground">Tänään · tavoite 8 h</span>
        <span className="font-display text-4xl font-semibold tabular-nums">{ready ? `${String(Math.floor(wholeMinutes / 60)).padStart(2, "0")}:${String(wholeMinutes % 60).padStart(2, "0")}` : "–:–"}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`size-1.5 rounded-full ${active ? "bg-emerald-600" : "bg-muted-foreground"}`} />{active ? "Työaika käynnissä" : "Ei käynnissä"}</span>
      </div>
    </div>
    <p className={`text-center text-xs tabular-nums ${overtime ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>{ready ? `${label} ${workDuration(difference)}` : "Työaikaa ladataan…"}</p>
  </div>
}
