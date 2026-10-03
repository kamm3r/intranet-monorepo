import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

export function AccountShell({ title, description, children, footer }) {
  return (
    <main className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <aside className="flex min-h-56 flex-col justify-between gap-10 bg-primary px-7 py-8 text-primary-foreground sm:px-10 sm:py-10 md:min-h-[480px]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-5" aria-hidden="true" />
            Intranet
          </div>
          <div className="max-w-sm">
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Työkalut yhdessä paikassa.
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-85 sm:text-base">
              Samalla tunnuksella pääset portaaliin, ajanvaraukseen ja työajan seurantaan.
            </p>
          </div>
          <p className="text-xs opacity-70">Virittämö intranet</p>
        </aside>
        <Card className="min-w-0 rounded-none border-0 shadow-none">
          <CardHeader className="pb-5">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter className="border-t pt-5 text-sm text-muted-foreground">{footer}</CardFooter>}
        </Card>
      </div>
    </main>
  );
}
