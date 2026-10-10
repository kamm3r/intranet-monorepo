import { memo, useMemo, useState } from "react"
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Slider } from "./ui/slider"

type Skill = { id: string; name: string; value: number }
const defaults = ["TypeScript", "Algoritmit", "Fullstack", "Data", "DevOps", "Tietokannat", "UI/UX", "Rust"]
const config = { value: { label: "Osaaminen", color: "var(--color-primary)" } } satisfies ChartConfig
const margin = { top: 16, right: 48, bottom: 16, left: 48 }
const clamp = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

function loadSkills(key: string): Skill[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || "null")
    if (Array.isArray(stored)) return stored.filter((item) => item && typeof item.name === "string" && typeof item.value === "number").map((item, index) => ({ id: typeof item.id === "string" ? item.id : `saved-${index}`, name: item.name, value: clamp(item.value) }))
    if (stored && typeof stored === "object") {
      const entries = stored as Record<string, unknown>
      return [...new Set([...defaults, ...Object.keys(entries)])].map((name, index) => ({ id: `legacy-${index}`, name, value: clamp(typeof entries[name] === "number" ? entries[name] as number : 0) }))
    }
  } catch { /* Use starter skills if browser storage is unavailable or malformed. */ }
  return defaults.map((name, index) => ({ id: `default-${index}`, name, value: 0 }))
}

export const SkillsCard = memo(function SkillsCard({ email }: { email: string }) {
  const storageKey = `portal-skills:${email}`
  const [skills, setSkills] = useState(() => loadSkills(storageKey))
  const [draft, setDraft] = useState(skills)
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [error, setError] = useState("")
  const chartData = useMemo(() => skills.map(({ name, value }) => ({ subject: name, value })), [skills])
  const update = (id: string, changes: Partial<Skill>) => setDraft((previous) => previous.map((skill) => skill.id === id ? { ...skill, ...changes } : skill))
  const addSkill = () => {
    const name = newName.trim()
    if (!name) return
    if (draft.some((skill) => skill.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) { setError("Tämä osaaminen on jo listassa."); return }
    setDraft((previous) => [...previous, { id: crypto.randomUUID(), name, value: 0 }])
    setNewName("")
    setError("")
  }
  const save = () => {
    const next = draft.map((skill) => ({ ...skill, name: skill.name.trim() }))
    if (next.some((skill) => !skill.name)) { setError("Anna jokaiselle osaamiselle nimi."); return }
    if (new Set(next.map((skill) => skill.name.toLocaleLowerCase())).size !== next.length) { setError("Jokaisella osaamisella on oltava eri nimi."); return }
    try { localStorage.setItem(storageKey, JSON.stringify(next)) }
    catch { setError("Tallennus epäonnistui. Tarkista selaimen tallennustilan asetukset."); return }
    setSkills(next)
    setOpen(false)
  }
  return <Card className="dashboard-card--skills min-w-0">
    <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-3">
      <CardTitle className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" aria-hidden="true" />Oma osaaminen</CardTitle>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setDraft(skills.map((skill) => ({ ...skill }))); setNewName(""); setError("") } }}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="size-3.5" /> Muokkaa</Button></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Oma osaaminen</DialogTitle><DialogDescription>Lisää omat taitosi, muokkaa nimiä ja arvioi osaamisesi asteikolla 0–100.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); addSkill() }} className="space-y-2">
            <Label htmlFor="new-skill">Uusi osaaminen</Label>
            <div className="flex gap-2"><Input id="new-skill" value={newName} maxLength={60} placeholder="Esimerkiksi projektinhallinta" onChange={(event) => setNewName(event.target.value)} /><Button type="submit" disabled={!newName.trim()}><Plus className="size-4" /> Lisää</Button></div>
          </form>
          <div className="space-y-3">
            {draft.map((skill) => <div key={skill.id} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2"><Input aria-label={`Osaamisen nimi: ${skill.name}`} value={skill.name} maxLength={60} onChange={(event) => update(skill.id, { name: event.target.value })} /><Button type="button" size="icon" variant="ghost" aria-label={`Poista osaaminen: ${skill.name}`} onClick={() => setDraft((previous) => previous.filter((item) => item.id !== skill.id))}><Trash2 className="size-4" /></Button></div>
              <div className="flex items-center gap-3"><Slider id={skill.name} aria-label={`${skill.name} osaamistaso`} min={0} max={100} step={5} value={[skill.value]} onValueChange={([value]) => update(skill.id, { value })} /><span className="w-9 shrink-0 text-right text-sm tabular-nums">{skill.value}</span></div>
            </div>)}
            {!draft.length && <p className="text-sm text-muted-foreground">Lisää ensimmäinen osaamisesi yllä.</p>}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">Tiedot tallennetaan tähän selaimeen käyttäjäkohtaisesti.</p>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Peruuta</Button><Button onClick={save}>Tallenna</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </CardHeader>
    <CardContent className="min-h-0 overflow-y-auto">
      {skills.some((skill) => skill.value > 0) && skills.length >= 3 ? <ChartContainer config={config} className="h-[218px] w-full">
        <RadarChart accessibilityLayer data={chartData} margin={margin}>
          <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Radar name="Osaaminen" dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.5} isAnimationActive={false} />
        </RadarChart>
      </ChartContainer> : skills.length > 0 && skills.some((skill) => skill.value > 0) ? <div className="space-y-4">{skills.map((skill) => <div key={skill.id}><div className="mb-2 flex justify-between gap-2 text-sm"><span className="break-words">{skill.name}</span><span>{skill.value}/100</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${skill.value}%` }} /></div></div>)}</div> : <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">Lisää omat taitosi ja osaamistasosi nähdäksesi kaavion.</p>}
    </CardContent>
  </Card>
})
