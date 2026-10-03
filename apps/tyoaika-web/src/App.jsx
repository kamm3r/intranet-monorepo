import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import WorkHourPage from "./pages/WorkHourPage";
import EmployeesPage from "./pages/EmployeesPage";
import WorkSchedulePage from "./pages/WorkSchedulePage";
import authorizeApi, { requestConfig } from "./api/authorize";
import { clearCookie, readCookie, writeCookie } from "./api/session";
import { domain, usersUrl, usersWebUrl } from "./config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const App = () => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const key = new URLSearchParams(window.location.search).get("user_key");
        const token = key
          ? await authorizeApi.getToken(key)
          : readCookie("tyoaikaToken") || readCookie("usersToken");
        if (!token) throw new Error("No session");
        authorizeApi.setToken(token);
        const currentUser = await authorizeApi.getUser();
        // The service authorization response carries access rights, while the
        // users profile carries the display name used in the navigation.
        let profile = {};
        try {
          const response = await fetch(`${usersUrl}/api/users`, { headers: requestConfig().headers });
          if (response.ok) profile = await response.json();
        } catch { /* Authorization is enough to continue without a display name. */ }
        if (key) {
          writeCookie("tyoaikaToken", token);
          window.history.replaceState({}, "", window.location.pathname);
        }
        if (active) setUser({ ...currentUser, ...profile });
      } catch {
        clearCookie("tyoaikaToken");
        if (active) setUser(null);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try { await authorizeApi.logout(); } catch { /* Clear the local session even if the API is unavailable. */ }
    clearCookie("tyoaikaToken");
    clearCookie("usersToken");
    authorizeApi.setToken("");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Header user={user} onLogout={logout} />
      {user === undefined ? (
        <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground sm:px-6">Ladataan käyttäjätietoja...</main>
      ) : !user ? (
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Kirjaudu sisään työaikakirjaukseen</CardTitle>
              <CardDescription>Kirjaudu intranetin tunnuksillasi nähdäksesi ja leimataksesi työaikasi.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild><a href={`${usersWebUrl}/?domain=${encodeURIComponent(new URL(domain).host)}`}>Kirjaudu sisään</a></Button></CardContent>
          </Card>
        </main>
      ) : (
        <Routes>
          <Route path="/" element={<WorkHourPage user={user} />} />
          <Route path="/employees" element={<EmployeesPage user={user} />} />
          <Route path="/work-schedule" element={<WorkSchedulePage user={user} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
