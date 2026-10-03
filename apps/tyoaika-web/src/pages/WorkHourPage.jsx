import React, { useState, useEffect } from "react";
import { apiUrl } from "../config";
import { requestConfig } from "../api/authorize";
import { getHHMMSS, getHHMM } from "../features/functions";
import { weekdays } from "../features/arrays";
import { CheckCircle2, Clock3, LogIn, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog";

const authHeaders = () => requestConfig().headers ?? {};

const WorkHourPage = ({ user }) => {
  const [time, setTime] = useState(getHHMMSS());
  const [arrival, setArrival] = useState(null);
  const [departure, setDeparture] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [workTimes, setWorkTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalTime, setModalTime] = useState(new Date());

  // Update the clock time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(getHHMMSS()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchWorkTime = async () => {
    const response = await fetch(`${apiUrl}/api/worktimes`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error("Work time request failed");
    const data = await response.json();
    setWorkTimes(data);

    const ownEntries = data.filter((entry) => entry.name === user.email);
    const open = ownEntries.find((entry) => !entry.departure);
    const latest = ownEntries[0];
    setClockedIn(Boolean(open));
    setArrival(open || latest ? new Date((open || latest).arrival) : null);
    setDeparture(!open && latest?.departure ? new Date(latest.departure) : null);
  };
  useEffect(() => {
    fetchWorkTime()
      .catch(() => setError("Työaikakirjauksia ei voitu ladata."))
      .finally(() => setLoading(false));
  }, [user.email]);

  // Function to save the arrival time to the backend and update the state
  const saveArrival = async () => {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `${apiUrl}/api/worktimes/arrival`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        await fetchWorkTime();
        setModalText("Olet kirjautunut sisään!");
        setModalTime(new Date());
        setShowModal(true);
      } else {
        setError(response.status === 409
          ? "Olet jo leimannut sisään. Päivitä sivu ja yritä uudelleen."
          : "Sisäänleimaus epäonnistui. Yritä uudelleen.");
      }
    } catch (error) {
      setError('Sisäänleimaus epäonnistui. Yritä uudelleen.');
    } finally {
      setPending(false);
    }
  };

  // Function to save the departure time to the backend and update the state
  const saveDeparture = async () => {
    if (!clockedIn) {
      setError('Leimaa ensin sisään.');
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `${apiUrl}/api/worktimes/departure`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        await fetchWorkTime();
        setModalText("Olet kirjautunut ulos!");
        setModalTime(new Date());
        setShowModal(true);
      } else {
        setError(response.status === 404
          ? "Avointa työaikakirjausta ei löytynyt. Päivitä sivu ja yritä uudelleen."
          : "Ulosleimaus epäonnistui. Yritä uudelleen.");
      }
    } catch (error) {
      setError('Ulosleimaus epäonnistui. Yritä uudelleen.');
    } finally {
      setPending(false);
    }
  };

  const recentEntries = workTimes.filter((entry) => entry.name === user.email).slice(0, 6);
  const dateLabel = new Date().toLocaleDateString("fi-FI", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Työaikaleimaus</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <Badge variant={clockedIn ? "success" : "outline"} className="px-3 py-1 text-sm" aria-live="polite">
          {clockedIn ? "Työaika käynnissä" : "Ei avointa työaikaa"}
        </Badge>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="min-w-0 gap-0">
          <CardHeader className="gap-2 border-b pb-5">
            <CardTitle className="flex items-center gap-2 text-lg"><Clock3 className="size-5 text-primary" aria-hidden="true" />Kellonaika</CardTitle>
            <CardDescription className="break-all">{[user.firstname, user.lastname].filter(Boolean).join(" ") || user.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-7">
            <p className="font-display text-6xl font-semibold leading-none tracking-tight tabular-nums text-primary sm:text-7xl" aria-label={`Kellonaika ${time}`}>{time}</p>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="xl" className="w-full text-lg" disabled={loading || pending || clockedIn} onClick={saveArrival}>
                <LogIn className="size-5" aria-hidden="true" />Sisään
              </Button>
              <Button size="xl" variant="outline" className="w-full text-lg" disabled={loading || pending || !clockedIn} onClick={saveDeparture}>
                <LogOut className="size-5" aria-hidden="true" />Ulos
              </Button>
            </div>
            <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Viimeisin sisäänleimaus</dt>
                <dd className="mt-1 font-display text-xl font-medium tabular-nums">{arrival ? getHHMMSS(arrival) : "–"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Viimeisin ulosleimaus</dt>
                <dd className="mt-1 font-display text-xl font-medium tabular-nums">{departure ? getHHMMSS(departure) : "–"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0">
          <CardHeader className="border-b pb-5">
            <CardTitle className="text-lg">Aiemmat työaikakirjaukset</CardTitle>
            <CardDescription>Kuusi viimeisintä leimausta</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 px-0 pt-2">
            {loading ? <p className="px-5 py-5 text-sm text-muted-foreground">Ladataan kirjauksia...</p> : recentEntries.length === 0 ? (
              <p className="px-5 py-5 text-sm text-muted-foreground">Ei kirjauksia vielä. Leimaa sisään aloittaaksesi työajan.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Päivämäärä</TableHead><TableHead>Sisään</TableHead><TableHead>Ulos</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentEntries.map((entry, index) => {
                    const stamped = new Date(entry.arrival);
                    return <TableRow key={entry._id ?? index}>
                      <TableCell className="whitespace-nowrap">{weekdays[stamped.getDay()]} {stamped.getDate()}.{stamped.getMonth() + 1}.</TableCell>
                      <TableCell className="tabular-nums">{getHHMM(stamped)}</TableCell>
                      <TableCell className="tabular-nums">{entry.departure ? getHHMM(new Date(entry.departure)) : "–"}</TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-accent text-primary"><CheckCircle2 className="size-6" aria-hidden="true" /></span>
            <DialogTitle>{modalText}</DialogTitle>
            <DialogDescription>Leimauksen aika {getHHMMSS(modalTime)}</DialogDescription>
            <DialogClose asChild><Button className="mt-3 w-full" onClick={() => setModalText("")}>Sulje</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default WorkHourPage;
