import { Link } from "react-router-dom";
import { useStore } from "../utils/store";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function Account() {
  const user = useStore((state) => state.user);
  return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <h1 className="mb-6 font-display text-3xl font-bold">Oma tili</h1>
    <Card><CardHeader><CardTitle>Tilin tiedot</CardTitle></CardHeader><CardContent className="space-y-6">
      <dl className="space-y-4"><div><dt className="text-sm text-muted-foreground">Nimi</dt><dd className="mt-1">{[user?.firstname, user?.lastname].filter(Boolean).join(" ") || "Ei määritetty"}</dd></div><div><dt className="text-sm text-muted-foreground">Sähköposti</dt><dd className="mt-1 break-all">{user?.email}</dd></div></dl>
      <Button asChild variant="outline"><Link to="/resetpassword">Vaihda salasana</Link></Button>
    </CardContent></Card>
  </main>;
}
