// node imports
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";

import authenticateApi from "../api/authenticate";
import authorizeApi from "../api/authorize";

import { useStore } from "../utils/store";
import { portalUrl } from "../config";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { AccountShell } from "../components/AccountShell";

export default function Login() {
  const { user, authReady, publicServices, publicServicesReady, setUser } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const [searchParams] = useSearchParams();
  const { domain: pathDomain } = useParams();
  const navigate = useNavigate();
  const requestedPath = searchParams.get("returnTo");
  const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/";
  const registerQuery = new URLSearchParams(searchParams);
  const serviceDestination = (protocol, host, key) => {
    const destination = new URL(returnTo, `${protocol}://${host}`);
    destination.searchParams.set("user_key", key);
    return destination.toString();
  };

  // url/?domain=example.com
  const domain = searchParams.get("domain") || pathDomain;

  useEffect(() => {
    if (authReady && user && domain && publicServicesReady && publicServices.find((s) => s.domain === domain)) {
      // If the user is already logged in and the domain parameter is specified,
      // redirect the user to the external service with the service key.
      authorizeAndRedirectUserToService().catch(() => setError("Sovellukseen siirtyminen epäonnistui. Yritä uudelleen."));
    }
  }, [authReady, publicServicesReady, publicServices, user, domain]);

  useEffect(() => {
    if (authReady && user && !domain) {
      // Already logged in with no external service requested:
      // hand off to the main intranet page.
      if (requestedPath && returnTo !== "/" && !returnTo.startsWith("/login") && !returnTo.startsWith("/register")) navigate(returnTo, { replace: true });
      else redirectToPortal();
    }
  }, [authReady, user, domain]);

  const authorizeAndRedirectUserToService = async () => {
    const data = await authorizeApi.authorizeForService(domain);
    const service = publicServices.find((s) => s.domain === domain);

    if (!service) return console.log("service not found for domain: ", domain);

    const protocol = service.protocol;

    window.location.href = serviceDestination(protocol, domain, data.user_key);
  };

  // Hand the logged-in user off to the main intranet (portal) page with
  // single sign-on. Falls back to a plain redirect if the portal service
  // is not registered on the hub.
  const redirectToPortal = async () => {
    try {
      const portalHost = new URL(portalUrl).host.toLowerCase();
      const data = await authorizeApi.authorizeForService(portalHost);

      if (data?.user_key) {
        window.location.href = `${portalUrl}/?user_key=${data.user_key}`;
        return;
      }
    } catch (exception) {
      console.log("portal SSO handoff failed, plain redirect: ", exception);
    }

    window.location.href = portalUrl;
  };

  if (!authReady || (domain && !publicServicesReady)) return <main className="p-4">Ladataan...</main>;

  if (domain && !publicServices.find((s) => s.domain === domain)) {
    return (
      <main className="px-4 pb-2 pt-4 sm:px-8 sm:py-4">
        <p>
          URL kentän domain parametrin arvo ei sisällä mitään sallituista
          sivuista.
        </p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="px-4 pb-2 pt-4 sm:px-8 sm:py-4">
        <p>Olet kirjautunut sisään email: {user.email}</p>
      </main>
    );
  }

  const loginButton = async (event) => {
    event.preventDefault();
    setError("");
    setPending(true);

    const credentials = {
      email,
      password,
    };

    let authenticatedUser = null;

    try {
      if (domain) {
        // If an external service was specified with the domain parameter.
        authenticatedUser = await authenticateApi.authenticateForService(
          credentials,
          domain,
        );
      } else {
        authenticatedUser = await authenticateApi.authenticate(credentials);
      }
    } catch (exception) {
      setError(exception.response?.data?.error || "Kirjautuminen epäonnistui. Tarkista tunnukset ja yritä uudelleen.");
      setPending(false);
      return;
    }

    if (authenticatedUser) {
      authorizeApi.setToken(authenticatedUser.token);

      const cookies = new Cookies();

      cookies.set("usersToken", authenticatedUser.token, {
        // Cookie expires in 60 days.
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        path: "/",
      });

      if (domain) {
        // If an external service was specified with the domain parameter.
        const service = publicServices.find((s) => s.domain === domain);

        if (!service) {
          setError("Sovellusta ei löytynyt.");
          setPending(false);
          return;
        }

        const protocol = service.protocol;

        window.location.href = serviceDestination(protocol, domain, authenticatedUser.user_key);
      } else setUser(authenticatedUser);
    } else {
      setError("Kirjautuminen epäonnistui. Tarkista tunnukset ja yritä uudelleen.");
      setPending(false);
    }
  };

  return (
    <AccountShell
      title="Kirjaudu intranettiin"
      description="Käytä omaa sähköpostiosoitettasi ja salasanaasi."
      footer={<div className="flex w-full flex-wrap justify-between gap-3">
        <Link to="/resetpassword" className="font-medium text-primary hover:underline">Unohditko salasanan?</Link>
        <Link to={`/register?${registerQuery}`} className="font-medium text-primary hover:underline">Luo tunnus</Link>
      </div>}
    >
        <form onSubmit={loginButton} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Sähköposti</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Salasana</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Kirjaudutaan..." : "Kirjaudu sisään"}</Button>
        </form>
    </AccountShell>
  );
}
