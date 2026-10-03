import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usersUrl } from "../config";
import { requestConfig } from "../api/authorize";
import { ArrowUpRight, Users } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const EmployeesPage = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.admin) return;
    const controller = new AbortController();
    fetch(`${usersUrl}/api/users/all`, {
      headers: requestConfig().headers,
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then((users) => setEmployees(users.sort((a, b) => a.email.localeCompare(b.email))))
      .catch((cause) => {
        if (cause.name !== "AbortError") setError("Työntekijöitä ei voitu ladata.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user.admin]);

  if (!user.admin) return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Alert variant="destructive"><AlertDescription>Vain järjestelmänvalvojat voivat nähdä työntekijät.</AlertDescription></Alert></main>;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Työntekijät</h1>
        <p className="mt-1 text-sm text-muted-foreground">Valitse työntekijä nähdäksesi hänen työaikakirjauksensa.</p>
      </div>
      {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="gap-0">
        <CardHeader className="flex-row items-center justify-between gap-3 border-b pb-5">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-primary" aria-hidden="true" />Työntekijäluettelo</CardTitle>
            <CardDescription>Intranetin käyttäjät</CardDescription>
          </div>
          {!loading && !error && <Badge variant="secondary">{employees.length} henkilöä</Badge>}
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? <p className="px-5 py-6 text-sm text-muted-foreground">Ladataan työntekijöitä...</p> : employees.length === 0 && !error ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Työntekijöitä ei löytynyt.</p>
          ) : (
            <ul className="divide-y">
              {employees.map((employee) => {
                const name = [employee.firstname, employee.lastname].filter(Boolean).join(" ") || employee.email;
                return <li key={employee.email} className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{name}</p>
                    {name !== employee.email && <p className="break-all text-sm text-muted-foreground">{employee.email}</p>}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/work-schedule?email=${encodeURIComponent(employee.email)}`} state={{ name }}>Työajat<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
                  </Button>
                </li>;
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default EmployeesPage;
