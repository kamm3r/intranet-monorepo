import { useState } from "react";
import { NavLink } from "react-router-dom";
import { CalendarRange, Clock3, Menu, Users, X } from "lucide-react";
import { portalWebUrl } from "../config";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const navLinks = [
  { to: "/", label: "Leimaus", icon: Clock3 },
  { to: "/employees", label: "Työntekijät", icon: Users, admin: true },
  { to: "/work-schedule", label: "Työajat", icon: CalendarRange },
];

const Header = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = navLinks.filter((link) => !link.admin || user?.admin);
  const name = user && ([user.firstname, user.lastname].filter(Boolean).join(" ") || user.email);
  const navClass = ({ isActive }) => `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href={portalWebUrl} className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Intranet</a>
        <span aria-hidden="true" className="mx-1 h-6 border-l border-border" />
        <span className="text-sm font-semibold text-primary sm:text-base">Työaika</span>
        {user && <nav aria-label="Työajan valikko" className="ml-5 hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} className={navClass}><Icon className="size-4" aria-hidden="true" />{label}</NavLink>)}
        </nav>}
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {name && <Badge variant="secondary" className="hidden max-w-44 truncate lg:inline-flex">{name}</Badge>}
          {user && <Button variant="outline" size="sm" onClick={() => { setMenuOpen(false); onLogout(); }}>Kirjaudu ulos</Button>}
          {user && <Button variant="ghost" size="icon" className="md:hidden" aria-label="Valikko" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</Button>}
        </div>
      </div>
      {user && menuOpen && <nav aria-label="Työajan mobiilivalikko" className="border-t bg-card px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-7xl flex-col">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setMenuOpen(false)} className={navClass}><Icon className="size-4" aria-hidden="true" />{label}</NavLink>)}
        </div>
      </nav>}
    </header>
  );
};

export default Header;
