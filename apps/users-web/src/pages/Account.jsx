import { Link } from "react-router-dom";
import { useStore } from "../utils/store";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageContainer, PageHeader } from "@intranet/ui/page";

export default function Account() {
  const user = useStore((state) => state.user);
  return <PageContainer width="narrow">
    <PageHeader title="Oma tili" description="Intranetin tunnuksesi tiedot." />
    <Card><CardHeader><CardTitle>Tilin tiedot</CardTitle></CardHeader><CardContent className="space-y-6">
      <dl className="space-y-4"><div><dt className="text-sm text-muted-foreground">Nimi</dt><dd className="mt-1">{[user?.firstname, user?.lastname].filter(Boolean).join(" ") || "Ei määritetty"}</dd></div><div><dt className="text-sm text-muted-foreground">Sähköposti</dt><dd className="mt-1 break-all">{user?.email}</dd></div></dl>
      <Button asChild variant="outline"><Link to="/resetpassword">Vaihda salasana</Link></Button>
    </CardContent></Card>
  </PageContainer>;
}
