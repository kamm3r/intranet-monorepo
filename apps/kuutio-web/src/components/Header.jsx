import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import useStore from "../store";
import { portalWebUrl } from "../config";
import Authorize from "./Authorize";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";

const Header = () => {
  const user = useStore((state) => state.user);
  const name = user && ([user.firstname, user.lastname].filter(Boolean).join(" ") || user.email);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href={portalWebUrl} className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Intranet</a>
        <span aria-hidden="true" className="mx-1 h-6 border-l border-border" />
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary sm:text-base">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          Kuutio
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {name && <Badge variant="secondary" className="hidden max-w-48 truncate sm:inline-flex">{name}</Badge>}
          <Authorize linkClassName={buttonVariants({ variant: "outline", size: "sm" })} />
        </div>
      </div>
    </header>
  );
};

export default Header;
