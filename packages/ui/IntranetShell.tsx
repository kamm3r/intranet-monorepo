import type { ReactNode } from "react"
import { AccountMenu } from "./AccountMenu"
import { ThemeToggle } from "./ThemeToggle"
import { Blocks, CalendarClock, CalendarDays, ChevronRight, Clock3, ExternalLink, Home, Network, UserCog, Users, type LucideIcon } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator, SidebarTrigger } from "./components/sidebar"

export type IntranetUser = { email: string; firstname?: string; lastname?: string; admin?: boolean }
export type IntranetUrls = { portal: string; users: string; kuutio: string; tyoaika: string }

type Props = { user?: IntranetUser | null; urls: IntranetUrls; signInUrl: string; onLogout: () => void; children?: ReactNode; headerActions?: ReactNode }
type NavItem = { label: string; href: string; icon: LucideIcon }

const externalLinks = [{ label: "ForeAmmatti", href: "https://www.foreammatti.fi" }, { label: "Intro", href: "https://intro.elbit.fi" }, { label: "Sarastia", href: "https://www.sarastia.fi" }]

function navigation(urls: IntranetUrls, user?: IntranetUser | null) {
  const primary: NavItem[] = [
    { label: "Etusivu", href: urls.portal, icon: Home },
    { label: "Kuutio", href: urls.kuutio, icon: CalendarClock },
    { label: "Työaikaleimaus", href: urls.tyoaika, icon: Clock3 },
    { label: "Työvuorosuunnitelma", href: `${urls.tyoaika}/work-schedule`, icon: CalendarDays },
  ]
  const admin: NavItem[] = user?.admin ? [
    { label: "Käyttäjät", href: `${urls.users}/users`, icon: UserCog },
    { label: "Palvelut", href: `${urls.users}/services`, icon: Blocks },
    { label: "Työntekijät", href: `${urls.tyoaika}/employees`, icon: Users },
  ] : []
  return { primary, admin }
}

const isActive = (href: string) => {
  const url = new URL(href, window.location.href)
  return url.origin === window.location.origin && (url.pathname === "/" ? window.location.pathname === "/" : window.location.pathname.startsWith(url.pathname))
}

// The most specific matching link names the current page in the header.
function currentPage(urls: IntranetUrls, user?: IntranetUser | null) {
  const { primary, admin } = navigation(urls, user)
  return [...primary, ...admin].filter((item) => isActive(item.href)).sort((a, b) => b.href.length - a.href.length)[0]?.label
}

function NavLinks({ items }: { items: NavItem[] }) {
  return <SidebarMenu>{items.map(({ label, href, icon: Icon }) => {
    const active = isActive(href)
    return <SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={active} className="h-auto min-h-10 text-sm data-[active=true]:text-sidebar-primary [&[data-active=true]>svg]:text-sidebar-primary"><a href={href} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" /><span className="min-w-0 whitespace-normal! break-words">{label}</span></a></SidebarMenuButton></SidebarMenuItem>
  })}</SidebarMenu>
}

export function IntranetSidebar({ user, urls, signInUrl, onLogout }: Props) {
  const { primary, admin } = navigation(urls, user)
  return <Sidebar>
    <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
      <a href={urls.portal} className="flex items-center gap-2.5 rounded-md px-1 py-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground" aria-hidden="true"><Network className="size-4" /></span>
        <span className="font-display text-xl font-bold tracking-tight">Intranet</span>
      </a>
    </SidebarHeader>
    <SidebarContent className="px-2"><nav aria-label="Intranetin valikko">
      <SidebarGroup><SidebarGroupLabel>Työkalut</SidebarGroupLabel><SidebarGroupContent><NavLinks items={primary} /></SidebarGroupContent></SidebarGroup>
      {admin.length > 0 && <SidebarGroup><SidebarGroupLabel>Hallinto</SidebarGroupLabel><SidebarGroupContent><NavLinks items={admin} /></SidebarGroupContent></SidebarGroup>}
      <SidebarGroup><SidebarGroupLabel>Muuta</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{externalLinks.map(({ label, href }) => <SidebarMenuItem key={label}><SidebarMenuButton asChild className="min-h-10 text-muted-foreground hover:text-sidebar-accent-foreground"><a href={href} target="_blank" rel="noreferrer">{label}<ExternalLink className="ml-auto size-3.5" aria-hidden="true" /><span className="sr-only">(avautuu uuteen välilehteen)</span></a></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
    </nav></SidebarContent>
    <SidebarFooter className="gap-3 p-4"><SidebarSeparator className="mx-0" />
      <AccountMenu user={user} usersUrl={urls.users} signInUrl={signInUrl} onLogout={onLogout} />
    </SidebarFooter>
  </Sidebar>
}

export function IntranetShell({ children, headerActions, ...props }: Props) {
  const page = currentPage(props.urls, props.user)
  return <SidebarProvider className="font-body">
    <IntranetSidebar {...props} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-5">
        <SidebarTrigger className="size-9" aria-label="Avaa tai sulje sivuvalikko" />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <nav aria-label="Murupolku" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <li><a href={props.urls.portal} className="text-muted-foreground transition-colors hover:text-foreground">Intranet</a></li>
            {page && page !== "Etusivu" && <><li aria-hidden="true"><ChevronRight className="size-3.5 text-muted-foreground" /></li><li className="truncate font-medium" aria-current="page">{page}</li></>}
          </ol>
        </nav>
        <div className="ml-auto flex items-center gap-1">{headerActions}<ThemeToggle /></div>
      </header>
      {children}
    </div>
  </SidebarProvider>
}
