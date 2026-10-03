import { useState } from "react";

import resetApi from "../api/reset";
import { useStore } from "../utils/store";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link } from "react-router-dom";
import { AccountShell } from "../components/AccountShell";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const { user } = useStore();

  if (user)
    return (
      <main className="flex flex-col grow justify-center items-center gap-2 px-4 pb-2 pt-4 sm:px-8 sm:py-4">
        <h2 className="text-3xl">
          Salasanan vaihto on käytettävissä kirjautumatta.
        </h2>
        <Link to="/" className="opacity-70 hover:opacity-100 hover:underline">
          Takaisin etusivulle
        </Link>
      </main>
    );

  const resetPassword = async (event) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setResetUrl("");
    setError("");
    const result = await resetApi.reset({ email: email.trim() });
    if (result.success) {
      setMessage(result.resetUrl
        ? "Kehitysympäristön vaihtolinkki on valmis. Linkki on voimassa 10 minuuttia."
        : "Salasanan vaihtolinkki lähetettiin sähköpostiin. Linkki on voimassa 10 minuuttia.");
      setResetUrl(result.resetUrl || "");
    }
    else setError(result.error || "Salasanan vaihtopyyntö epäonnistui.");
    setPending(false);
  };

  return (
    <AccountShell
      title="Vaihda salasana"
      description="Anna tunnuksesi sähköpostiosoite. Saat kertakäyttöisen linkin salasanan vaihtoon."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Takaisin kirjautumiseen</Link>}
    >
        <form onSubmit={resetPassword} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-email">Sähköposti</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {message && <p role="status" className="text-sm">{message}</p>}
          {resetUrl && <a href={resetUrl} className="text-sm underline">Avaa salasanan vaihtolinkki</a>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Lähetetään..." : "Lähetä vaihtolinkki"}</Button>
        </form>
    </AccountShell>
  );
}
