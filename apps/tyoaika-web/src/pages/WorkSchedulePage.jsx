import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Spinner from "../components/Spinner";
import { getHHMM } from "../features/functions";
import { weekdays, months } from "../features/arrays";
import { apiUrl } from "../config";
import { requestConfig } from "../api/authorize";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageContainer, PageHeader } from "@intranet/ui/page";

const WorkSchedulePage = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const requestedEmail = new URLSearchParams(location.search).get("email");
  const email = user.admin && requestedEmail ? requestedEmail : user.email;

  /* Fetch the work schedule data by setting the day of the selected month to 1 and use a while loop until the month changes */
  const fetchMonthData = async (signal) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${apiUrl}/api/worktimes`, { headers: requestConfig().headers, signal });
      if (!response.ok) throw new Error("Työaikakirjauksia ei voitu ladata.");
      const entries = (await response.json()).filter((entry) => entry.name === email);
      let _days = [];
      let date = new Date(currentYear, currentMonth, 1);
      while (date.getMonth() === currentMonth) {
        const dayEntries = entries.filter((entry) => {
          const arrivalDate = new Date(entry.arrival);
          return arrivalDate.getFullYear() === date.getFullYear() &&
            arrivalDate.getMonth() === date.getMonth() && arrivalDate.getDate() === date.getDate();
        });
        const arrival = dayEntries.length
          ? dayEntries.reduce((first, entry) => new Date(entry.arrival) < new Date(first) ? entry.arrival : first, dayEntries[0].arrival)
          : null;
        const completed = dayEntries.filter((entry) => entry.departure);
        const departure = completed.length
          ? completed.reduce((last, entry) => new Date(entry.departure) > new Date(last) ? entry.departure : last, completed[0].departure)
          : null;

        /* Push the date object with stamp data to the list and set the date 1 up */
        _days.push({
          day: date.getDay(),
          date: date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          arrival: arrival,
          departure: departure,
        });
        date.setDate(date.getDate() + 1);
      }
      if (!signal.aborted) setDays(_days);
    } catch (cause) {
      if (!signal.aborted) {
        setDays([]);
        setError("Työaikakirjauksia ei voitu ladata.");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  /* Do the fetching when the month changes */
  useEffect(() => {
    const controller = new AbortController();
    fetchMonthData(controller.signal);
    return () => controller.abort();
  }, [currentMonth, currentYear, email]);

  const prevMonth = () => setSelectedMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));

  const displayName = location.state?.name || (email === user.email ? [user.firstname, user.lastname].filter(Boolean).join(" ") : "") || email;
  const today = new Date();
  const isToday = (day) => day.year === today.getFullYear() && day.month === today.getMonth() && Number(day.date) === today.getDate();
  const timeTag = (stamp) => stamp ? getHHMM(new Date(stamp)) : "–";

  return (
    <PageContainer>
      <PageHeader title="Työvuorosuunnitelma" description={<span className="break-all">{displayName}</span>} actions={user.admin && requestedEmail && <Button variant="outline" size="sm" asChild><Link to="/employees"><ArrowLeft className="size-4" aria-hidden="true" />Työntekijät</Link></Button>} />
      {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="min-w-0 gap-0">
        <CardHeader className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="size-5 text-primary" aria-hidden="true" />Kuukauden leimaukset</CardTitle>
            <CardDescription>Työaikakirjaukset päivittäin</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Edellinen kuukausi" onClick={prevMonth}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
            <span className="min-w-36 text-center font-display font-semibold" aria-live="polite">{months[currentMonth]} {currentYear}</span>
            <Button type="button" variant="outline" size="icon" aria-label="Seuraava kuukausi" onClick={nextMonth}><ChevronRight className="size-4" aria-hidden="true" /></Button>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 px-0 py-0">
          {loading ? <Spinner /> : days.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Kuukauden tietoja ei voitu näyttää.</p>
          ) : <Table>
            <TableHeader><TableRow><TableHead>Päivä</TableHead><TableHead>Sisään</TableHead><TableHead>Ulos</TableHead></TableRow></TableHeader>
            <TableBody>
              {days.map((day) => <TableRow key={`${day.year}-${day.month}-${day.date}`} className={isToday(day) ? "bg-accent/70" : ""}>
                <TableCell className="whitespace-nowrap">
                  <span className="mr-2 text-muted-foreground">{weekdays[day.day]}</span>
                  <span>{day.date}.{String(day.month + 1).padStart(2, "0")}.{day.year}</span>
                  {isToday(day) && <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">Tänään</Badge>}
                </TableCell>
                <TableCell className="tabular-nums">{timeTag(day.arrival)}</TableCell>
                <TableCell className="tabular-nums">{timeTag(day.departure)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default WorkSchedulePage;
