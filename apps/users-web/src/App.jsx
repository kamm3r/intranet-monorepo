import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import serviceApi from "./api/services";

import { CookieTracker } from "./utils/CookieTracker";
import { ThemeProvider } from "./components/theme-provider";
import { useStore } from "./utils/store";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reset from "./pages/Reset";
import Services from "./pages/Services";
import ServiceForm from "./pages/ServiceForm";
import Users from "./pages/Users";
import { ModeToggle } from "./components/header";
import { IntranetShell } from "@intranet/ui/shell";
import { portalUrl, kuutioWebUrl, tyoaikaWebUrl } from "./config";
import authorizeApi from "./api/authorize";
import Cookies from "universal-cookie";

function UsersLayout({ children }) {
  const { user, authReady, setUser } = useStore();
  const location = useLocation();
  const protectedPage = location.pathname.startsWith("/users") || location.pathname.startsWith("/services") || location.pathname === "/account";
  const logout = async () => {
    try { await authorizeApi.logout(); } catch { /* Always clear local sessions. */ }
    const cookies = new Cookies();
    for (const name of ["usersToken", "portalToken", "kuutioToken", "tyoaikaToken"]) cookies.remove(name, { path: "/" });
    authorizeApi.setToken(null);
    setUser(null);
  };
  if (protectedPage && !authReady) return <main className="p-6" role="status">Ladataan käyttäjätietoja…</main>;
  if (protectedPage && !user) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <IntranetShell user={user} urls={{ portal: portalUrl, users: window.location.origin, kuutio: kuutioWebUrl, tyoaika: tyoaikaWebUrl }} signInUrl={`/login${location.search}`} onLogout={logout} headerActions={<ModeToggle />}>{children}</IntranetShell>;
}

export default function App() {
  const { setPublicServices, setPublicServicesReady } = useStore();

  // Load the allowed domains from the server and save them to the state.
  const loadPublicServices = async () => {
    try {
      const services = await serviceApi.getAllPublic();
      setPublicServices(services);
    } catch (exception) {
      console.log("exception: ", exception);
    } finally {
      setPublicServicesReady(true);
    }
  };

  useEffect(() => {
    loadPublicServices();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CookieTracker />
      <Router>
        <UsersLayout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/:domain" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:domain" element={<Login />} />

          <Route path="/register" element={<Register />} />
          <Route path="/register/:domain" element={<Register />} />

          <Route path="/resetpassword" element={<Reset />} />

          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceForm />} />
          <Route path="/services/add" element={<ServiceForm />} />

          <Route path="/account" element={<Account />} />
          <Route path="/users" element={<Users />} />
        </Routes>
        </UsersLayout>
      </Router>
    </ThemeProvider>
  );
}
