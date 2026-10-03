import { useState } from "react";
import Cookies from "universal-cookie";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDownIcon, Menu, Moon, Sun, X } from "lucide-react";
import authorizeApi from "../api/authorize";
import { useStore } from "../utils/store";
import { portalUrl } from "../config";
import { Button } from "./ui/button";
import { useTheme } from "./theme-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function ModeToggle() {
  const { setTheme } = useTheme();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Vaihda teemaa"><Sun className="size-4 dark:hidden" /><Moon className="hidden size-4 dark:block" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => setTheme("light")}>Vaalea</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>Tumma</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>Järjestelmä</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function UserNav({ user }) {
  const setUser = useStore((state) => state.setUser);
  const logout = async () => {
    try { await authorizeApi.logout(); } catch { /* Clear the local session even when the API is unavailable. */ }
    new Cookies().remove("usersToken", { path: "/" });
    setUser(null);
  };
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="max-w-48"><span className="truncate">{user.email}</span><ChevronDownIcon className="size-4 shrink-0" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent className="w-60" align="end">
      <DropdownMenuLabel className="break-all font-normal">{user.email}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {user.admin && <>
        <DropdownMenuItem asChild><Link to="/services">Palvelut</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/users">Käyttäjät</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
      </>}
      <DropdownMenuItem onClick={logout}>Kirjaudu ulos</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

const navClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;

export function Navbar() {
  const user = useStore((state) => state.user);
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const section = pathname.startsWith("/services") ? "Palvelut" : pathname.startsWith("/users") ? "Käyttäjät" : "Tili";
  const registerPage = pathname.startsWith("/register");

  return <header className="sticky top-0 z-30 w-full border-b bg-card/95 backdrop-blur">
    <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
      <a href={portalUrl} className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Intranet</a>
      <span aria-hidden="true" className="mx-1 h-6 border-l border-border" />
      <Link to={user?.admin ? "/users" : "/"} className="text-sm font-semibold text-primary sm:text-base">{section}</Link>
      {user?.admin && <nav aria-label="Käyttäjähallinnan valikko" className="ml-5 hidden items-center gap-1 md:flex">
        <NavLink to="/users" className={navClass}>Käyttäjät</NavLink>
        <NavLink to="/services" className={navClass}>Palvelut</NavLink>
      </nav>}
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <ModeToggle />
        {user ? <div className="hidden md:block"><UserNav user={user} /></div> : <Link to={registerPage ? "/" : "/register"} className="hidden text-sm font-medium text-primary hover:underline md:block">{registerPage ? "Kirjaudu sisään" : "Rekisteröidy"}</Link>}
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Avaa valikko" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</Button>
      </div>
    </div>
    {menuOpen && <nav aria-label="Käyttäjähallinnan mobiilivalikko" className="border-t bg-card px-4 py-3 md:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2">
        {user?.admin && <><NavLink to="/users" onClick={() => setMenuOpen(false)} className={navClass}>Käyttäjät</NavLink><NavLink to="/services" onClick={() => setMenuOpen(false)} className={navClass}>Palvelut</NavLink></>}
        {user ? <UserNav user={user} /> : <Link to={registerPage ? "/" : "/register"} onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-primary">{registerPage ? "Kirjaudu sisään" : "Rekisteröidy"}</Link>}
      </div>
    </nav>}
  </header>;
}
