import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IntranetShell } from "@intranet/ui/shell";
import { useServiceSession } from "@intranet/ui/session";
import { PageStatus } from "@intranet/ui/page";
import WorkHourPage from "./pages/WorkHourPage";
import EmployeesPage from "./pages/EmployeesPage";
import WorkSchedulePage from "./pages/WorkSchedulePage";
import authorizeApi from "./api/authorize";
import { domain, usersUrl, usersWebUrl, portalWebUrl, kuutioWebUrl } from "./config";

export default function App() {
  const { user, ready, error, logout, loginUrl } = useServiceSession({ client: authorizeApi, cookieName: "tyoaikaToken", usersUrl: usersWebUrl, profileUrl: `${usersUrl}/api/users`, domain });
  return <BrowserRouter><IntranetShell user={user} urls={{ portal: portalWebUrl, users: usersWebUrl, kuutio: kuutioWebUrl, tyoaika: domain }} signInUrl={loginUrl} onLogout={logout}>
    {!ready ? <PageStatus error={error} /> : <Routes>
      <Route path="/" element={<WorkHourPage user={user} />} />
      <Route path="/employees" element={<EmployeesPage user={user} />} />
      <Route path="/work-schedule" element={<WorkSchedulePage user={user} />} />
    </Routes>}
  </IntranetShell></BrowserRouter>;
}
