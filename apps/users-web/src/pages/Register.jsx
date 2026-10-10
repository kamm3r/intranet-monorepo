import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Cookies from "universal-cookie";

import userApi from "../api/users";
import authorizeApi from "../api/authorize";
import authenticateApi from "../api/authenticate";
import { useStore } from "../utils/store";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AccountShell } from "../components/AccountShell";
import { Link } from "react-router-dom";

export default function Register() {
  const { user, authReady, setUser, publicServices, publicServicesReady } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const { domain: pathDomain } = useParams();

  // /register/?domain=test
  const domain = searchParams.get("domain") || pathDomain;

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
        <p>Olet kirjautunut sisään sähköpostilla: {user.email}</p>
      </main>
    );
  }

  const validate = () => {
    if (password.length < 11) {
      return "Salasanassa on oltava vähintään 11 merkkiä.";
    }
    if (password !== passwordCheck) {
      return "Salasanat eivät täsmää.";
    }
    if (email.trim().length < 5) {
      return "Sähköpostiosoite on liian lyhyt.";
    }
    if (!email.includes("@")) {
      return "Anna kelvollinen sähköpostiosoite.";
    }

    return "";
  };

  const registerAndLogin = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setPending(true);
    setError("");

    const credentials = { password, email: email.trim().toLowerCase() };

    try {
      await userApi.create(credentials);

      const authenticatedUser = await authenticateApi.authenticate(credentials);

      if (authenticatedUser) {
        authorizeApi.setToken(authenticatedUser.token);
        const cookies = new Cookies();

        cookies.set("usersToken", authenticatedUser.token, {
          // Cookie expires in 60 days.
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
          path: "/",
        });

        setUser(authenticatedUser);

        navigate(`/login?${searchParams}`);
      } else setError("Kirjautuminen epäonnistui rekisteröinnin jälkeen.");
    } catch (exception) {
      setError(exception.response?.data?.error || "Rekisteröinti epäonnistui. Tarkista tiedot ja yritä uudelleen.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AccountShell
      title="Luo intranet-tunnus"
      description="Tunnuksellasi pääset niihin sovelluksiin, joihin sinulle on annettu käyttöoikeus."
      footer={<p>Onko sinulla jo tunnus? <Link to={`/login?${searchParams}`} className="font-medium text-primary hover:underline">Kirjaudu sisään</Link></p>}
    >
          <form onSubmit={registerAndLogin} className="flex flex-col gap-4">
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Salasana uudelleen</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordCheck}
                onChange={(event) => setPasswordCheck(event.target.value)}
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Rekisteröidään..." : "Luo tunnus"}</Button>
          </form>
    </AccountShell>
  );
}
