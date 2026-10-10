import { useEffect, useState, type ReactNode } from "react"
import { ChevronRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, LayoutGrid, Trash2, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Calendar } from "./components/ui/calendar"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { format } from "date-fns"
import { fi } from "react-day-picker/locale"
import { useServiceSession } from "@intranet/ui/session"
import { IntranetShell } from "@intranet/ui/shell"
import { PageHeader, PageStatus } from "@intranet/ui/page"
import { SkillsCard } from "./components/SkillsCard"
import { WorkTimeProgress, workDuration } from "./components/WorkTimeProgress"
import authorizeApi from "./api/authorize"
import { kuutioApiUrl, kuutioWebUrl, tyoaikaApiUrl, tyoaikaWebUrl, usersWebUrl, domain } from "./config"
import useStore from "./store"

type Booking = {
  _id: string
  topic: string
  name: string
  selectedDate: string
  selectedTime: string[]
  endingTime: string
  createdBy?: string
}

type WorkTime = {
  _id: string
  name: string
  arrival: string
  departure?: string
}

const timeSlots = Array.from({ length: 21 }, (_, index) => {
  const minutes = 7 * 60 + 30 + index * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})
const dateKey = (date: Date) => format(date, "yyyy-MM-dd")
const addMinutes = (time: string, minutes: number) => {
  const [hour, minute] = time.split(":").map(Number)
  const total = hour * 60 + minute + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}
const bookingDate = (booking: Booking) => dateKey(new Date(booking.selectedDate))
const authHeaders = () => authorizeApi.requestConfig().headers ?? {}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function ReserveMeetingDialog({ bookings, onCreated, name, disabled, initialDate }: {
  bookings: Booking[]
  onCreated: (date: Date) => Promise<void>
  disabled: boolean
  initialDate: Date | undefined
  name: string
}) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const reserved = new Set(bookings.filter((booking) => date && bookingDate(booking) === dateKey(date))
    .flatMap((booking) => booking.selectedTime))
  const available = timeSlots.filter((slot) => {
    if (!date) return false
    const slots = Array.from({ length: Number(duration) / 30 }, (_, index) => addMinutes(slot, index * 30))
    if (slots.some((value) => !timeSlots.includes(value) || reserved.has(value))) return false
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(slot.slice(0, 2)), Number(slot.slice(3)))
    return selected > new Date()
  })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || disabled || !date || !time || !available.includes(time) || !topic.trim()) return
    setSaving(true)
    setError("")
    try {
      await requestJson(`${kuutioApiUrl}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          name,
          selectedDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          selectedTime: Array.from({ length: Number(duration) / 30 }, (_, index) => addMinutes(time, index * 30)),
          endingTime: addMinutes(time, Number(duration)),
        }),
      })
      await onCreated(date)
      setOpen(false)
      setTopic("")
      setTime("")
    } catch {
      setError("Varaus epäonnistui. Valittu aika voi olla jo varattu.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (saving) return; setOpen(next); if (next) { setDate(initialDate && dateKey(initialDate) >= dateKey(new Date()) ? initialDate : new Date()); setTime(""); setError("") } }}> 
      <DialogTrigger asChild><Button size="sm" disabled={disabled}>Varaa aika</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Varaa Kuutio</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-topic">Aihe</Label>
            <Input id="booking-topic" value={topic} onChange={(event) => setTopic(event.target.value)} required maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>Varauspäivä</Label>
            <div className="max-w-full overflow-x-auto"><Calendar locale={fi} mode="single" selected={date} onSelect={(selected) => { setDate(selected); setTime("") }} disabled={{ before: new Date() }} className="p-0" /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kesto</Label>
              <Select value={duration} onValueChange={(value) => { setDuration(value); setTime("") }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="30">30 minuuttia</SelectItem><SelectItem value="60">1 tunti</SelectItem><SelectItem value="90">1,5 tuntia</SelectItem><SelectItem value="120">2 tuntia</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aloitusaika</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Valitse vapaa aika" /></SelectTrigger>
                <SelectContent>{available.map((slot) => <SelectItem key={slot} value={slot}>{slot}–{addMinutes(slot, Number(duration))}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {available.length === 0 && <p className="text-sm text-muted-foreground">Valitulle päivälle ei ole vapaita aikoja.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Peruuta</Button><Button type="submit" disabled={saving || disabled || !time || !date || !available.includes(time) || !topic.trim()}>{saving ? "Varataan..." : "Varaa aika"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelBookingDialog({ booking, onCancelled }: { booking: Booking; onCancelled: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  return <Dialog open={open} onOpenChange={(next) => { if (!saving) { setOpen(next); setError("") } }}>
    <DialogTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`Peru varaus: ${booking.topic}`}><Trash2 className="size-4" /></Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Perutaanko varaus?</DialogTitle></DialogHeader>
      <p className="text-sm">{booking.topic} · {format(new Date(booking.selectedDate), "d.M.yyyy")} · {booking.selectedTime[0]}–{booking.endingTime}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Takaisin</Button><Button variant="destructive" disabled={saving} onClick={async () => {
        setSaving(true)
        try { await requestJson(`${kuutioApiUrl}/booking/${booking._id}`, { method: "DELETE" }); await onCancelled(); setOpen(false) }
        catch { setError("Varausta ei voitu perua. Yritä uudelleen.") }
        finally { setSaving(false) }
      }}>{saving ? "Perutaan…" : "Peru varaus"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}

export default function App() {
  const setUser = useStore((state) => state.setUser)
  const { user, ready, error: sessionError, logout, loginUrl } = useServiceSession({ client: authorizeApi, cookieName: "portalToken", usersUrl: usersWebUrl, domain, onUser: setUser })
  const [now, setNow] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [bookingError, setBookingError] = useState("")
  const [workError, setWorkError] = useState("")
  const [punching, setPunching] = useState(false)
  const [workReady, setWorkReady] = useState(false)
  const [bookingsReady, setBookingsReady] = useState(false)
  const [actionMessage, setActionMessage] = useState("")
  const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.email || ""

  const loadBookings = async () => {
    try {
      const result = await requestJson<{ data: Booking[] }>(`${kuutioApiUrl}/booking/getbookings`)
      setBookings(result.data)
      setBookingError("")
      setBookingsReady(true)
    } catch { setBookingError("Varauksia ei voitu ladata.") }
  }
  const loadWorkTimes = async () => {
    try {
      const result = await requestJson<WorkTime[]>(`${tyoaikaApiUrl}/worktimes`)
      setWorkTimes(result)
      setWorkError("")
      setWorkReady(true)
    } catch { setWorkError("Työaikakirjauksia ei voitu ladata.") }
  }

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  useEffect(() => {
    setWorkReady(false)
    setBookingsReady(false)
    setActionMessage("")
    if (!user) {
      setBookings([])
      setWorkTimes([])
      setBookingError("")
      setWorkError("")
      return
    }
    void loadBookings()
    void loadWorkTimes()
  }, [user?.email])

  const ownTimes = workTimes.filter((entry) => entry.name === user?.email)
  const openTime = ownTimes.find((entry) => !entry.departure)
  const today = dateKey(now)
  const tomorrow = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  const sortedBookings = [...bookings].sort((left, right) =>
    new Date(left.selectedDate).getTime() - new Date(right.selectedDate).getTime() ||
    (left.selectedTime[0] || "").localeCompare(right.selectedTime[0] || ""))
  const selectedBookings = sortedBookings.filter((booking) => selectedDate && bookingDate(booking) === dateKey(selectedDate))
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayMinutes = ownTimes.reduce((sum, entry) => {
    const start = Math.max(dayStart, new Date(entry.arrival).getTime())
    const end = Math.min(now.getTime(), new Date(entry.departure || now).getTime())
    return sum + (Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 60000 : 0)
  }, 0)

  const punch = async () => {
    if (punching || !workReady) return
    setActionMessage("")
    setPunching(true)
    setWorkError("")
    try {
      await requestJson(`${tyoaikaApiUrl}/worktimes/${openTime ? "departure" : "arrival"}`, {
        method: openTime ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      await loadWorkTimes()
      setActionMessage(openTime ? "Ulosleimaus tallennettu." : "Sisäänleimaus tallennettu.")
    } catch { setWorkError("Leimaus epäonnistui. Yritä uudelleen.") }
    finally { setPunching(false) }
  }

  if (!ready) return <PageStatus error={sessionError} />

  const meetingList = (date: string) => sortedBookings.filter((booking) => bookingDate(booking) === date)
  const upcoming = sortedBookings.filter((booking) => bookingDate(booking) >= today).length
  const dateLabel = now.toLocaleDateString("fi-FI", { weekday: "long", day: "numeric", month: "long" })
  return (
    <IntranetShell user={user} urls={{ portal: domain, users: usersWebUrl, kuutio: kuutioWebUrl, tyoaika: tyoaikaWebUrl }} signInUrl={loginUrl} onLogout={logout}>
      <main className="dashboard-container min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <PageHeader title={`Hei, ${user?.firstname || "tervetuloa"}`} description={`${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)} · tämä viikko yhdellä silmäyksellä`} />
          {actionMessage && <p role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200"><CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />{actionMessage}</p>}
          <div className="dashboard-grid">
            <Card className="dashboard-card--time flex min-w-0 flex-col">
              <CardHeading icon={Clock3} title="Työaikaleimaus" />
              <CardContent className="flex flex-grow items-center justify-center">
                <WorkTimeProgress minutes={todayMinutes} active={!!openTime} ready={!!user && workReady && !workError} saving={punching} completed={ownTimes.some((entry) => !!entry.departure && new Date(entry.departure).getTime() >= dayStart)} onStamp={punch} />
              </CardContent>
              {workError && <CardFooter><p role="alert" className="w-full text-center text-xs text-destructive">{workError}</p></CardFooter>}
            </Card>
            <Card className="dashboard-card--meetings flex min-w-0 flex-col">
              <CardHeading icon={CalendarClock} title="Kuutio-varaukset" />
              <CardContent className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-1">
                {[{ label: "Tänään", key: today }, { label: "Huomenna", key: tomorrow }].map(({ label, key }) =>
                  <section key={key} className="space-y-1.5">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label} · {format(new Date(key), "d.M.")}</h2>
                    {meetingList(key).length ? meetingList(key).map((booking) =>
                      <div key={booking._id} className="flex min-w-0 justify-between gap-2 rounded-md border-l-2 border-primary bg-secondary px-2.5 py-2 text-sm text-secondary-foreground">
                        <span className="min-w-0 truncate">{booking.topic}</span><span className="shrink-0 tabular-nums text-muted-foreground">{booking.selectedTime[0]}–{booking.endingTime}</span>
                      </div>) : <p className="text-sm text-muted-foreground">Ei varauksia</p>}
                  </section>)}
                {bookingError && <p role="alert" className="text-xs text-destructive">{bookingError}</p>}
              </CardContent>
              <CardFooter className="mt-auto">{user ? <ReserveMeetingDialog bookings={bookings} disabled={!bookingsReady || !!bookingError} initialDate={selectedDate} onCreated={async (date) => { setSelectedDate(date); await loadBookings(); setActionMessage("Kuutio-varaus tallennettu.") }} name={name} /> : <Button asChild size="sm"><a href={kuutioWebUrl}>Kuutio</a></Button>}</CardFooter>
            </Card>
            <Card className="dashboard-card--projects min-w-0">
              <CardHeading icon={LayoutGrid} title="Pikalinkit" />
              <CardContent className="space-y-2 px-4">
                {[
                  { label: "Kuutio", description: "Varaa huone", href: kuutioWebUrl, icon: CalendarClock },
                  { label: "Leimaus", description: "Sisään ja ulos", href: tyoaikaWebUrl, icon: Clock3 },
                  { label: "Työajat", description: "Kuukausinäkymä", href: `${tyoaikaWebUrl}/work-schedule`, icon: CalendarDays },
                ].map(({ label, description, href, icon: Icon }) =>
                  <a key={label} href={href} className="group flex min-w-0 items-center gap-3 rounded-lg border p-2.5 transition-colors hover:border-primary/30 hover:bg-accent">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary group-hover:bg-background" aria-hidden="true"><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{label}</span><span className="block truncate text-xs text-muted-foreground">{description}</span></span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none" aria-hidden="true" />
                  </a>)}
              </CardContent>
            </Card>
            <div className="dashboard-card--summary grid min-w-0 grid-cols-1 gap-5">
              <StatCard title="Työaika tänään" value={workDuration(todayMinutes)} caption="Päivätavoite 8 h" />
              <StatCard title="Tulevat varaukset" value={String(upcoming)} caption={upcoming === 1 ? "varaus Kuutiossa" : "varausta Kuutiossa"} />
            </div>
            <Card className="dashboard-card--calendar min-w-0">
              <CardContent className="dashboard-calendar-content flex min-w-0 flex-col gap-5 px-5 py-3">
                <div className="max-w-full overflow-x-auto"><Calendar locale={fi} mode="single" selected={selectedDate} onSelect={setSelectedDate} className="p-0" /></div>
                <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto">
                  <h2 className="text-sm font-medium">{selectedDate ? <>Varaukset <span className="tabular-nums">{format(selectedDate, "d.M.yyyy")}</span></> : "Valitse päivä"}</h2>
                  {selectedBookings.length ? selectedBookings.map((booking) =>
                    <div key={booking._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 break-words">{booking.topic}</span><div className="flex items-center gap-1"><span className="tabular-nums text-muted-foreground">{booking.selectedTime[0]}–{booking.endingTime}</span>{user && (user.admin || booking.createdBy === user.email) && <CancelBookingDialog booking={booking} onCancelled={async () => { setBookings((previous) => previous.filter((item) => item._id !== booking._id)); setActionMessage("Varaus peruttu.") }} />}</div>
                    </div>) : <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">Ei varauksia tälle päivälle.</p>}
                </div>
              </CardContent>
            </Card>
            <SkillsCard key={user?.email || "guest"} email={user?.email || "guest"} />
          </div>
        </div>
      </main>
    </IntranetShell>
  )
}

function CardHeading({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
  return <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-3">
    <CardTitle className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-primary" aria-hidden="true" />{title}</CardTitle>
    {action}
  </CardHeader>
}

function StatCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return <Card className="h-full w-full min-w-0 justify-between">
    <CardHeader className="px-5 py-0"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent className="px-5"><p className="font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></CardContent>
  </Card>
}
