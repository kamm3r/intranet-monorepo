import { ShieldAlert } from "lucide-react";
import { PageContainer } from "@intranet/ui/page";
import { Button } from "./ui/button";

export function AdminOnly() {
  return (
    <PageContainer width="narrow">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true"><ShieldAlert className="size-5" /></span>
        <h1 className="font-display text-xl font-semibold">Ei käyttöoikeutta</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Vain järjestelmänvalvojat voivat käyttää tätä sivua.</p>
        <Button asChild variant="outline" className="mt-2"><a href="/account">Oma tili</a></Button>
      </div>
    </PageContainer>
  );
}
