import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IntranetShell } from "@intranet/ui/shell";
import { useServiceSession } from "@intranet/ui/session";
import { PageStatus } from "@intranet/ui/page";
import BookingPage from "./pages/BookingPage";
import authorizeApi from "./api/authorize";
import useStore from "./store";
import { domain, usersUrl, usersWebUrl, portalWebUrl, tyoaikaWebUrl } from "./config";

export default function App() {
  const setUser = useStore((state) => state.setUser);
  const { user, ready, error, logout, loginUrl } = useServiceSession({ client: authorizeApi, cookieName: "kuutioToken", usersUrl: usersWebUrl, profileUrl: `${usersUrl}/api/users`, domain, onUser: setUser });
  return <BrowserRouter><IntranetShell user={user} urls={{ portal: portalWebUrl, users: usersWebUrl, kuutio: domain, tyoaika: tyoaikaWebUrl }} signInUrl={loginUrl} onLogout={logout}>
    {ready ? <Routes><Route path="/" element={<BookingPage />} /></Routes> : <PageStatus error={error} />}
  </IntranetShell></BrowserRouter>;
}
