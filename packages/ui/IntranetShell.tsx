import type { ReactNode } from "react"
import { AccountMenu } from "./AccountMenu"
import { CalendarClock, CalendarDays, CalendarRange, ExternalLink, Home, Users } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator, SidebarTrigger } from "./components/sidebar"

export type IntranetUser = { email: string; firstname?: string; lastname?: string; admin?: boolean }
export type IntranetUrls = { portal: string; users: string; kuutio: string; tyoaika: string }

type Props = { user?: IntranetUser | null; urls: IntranetUrls; signInUrl: string; onLogout: () => void; children?: ReactNode; headerActions?: ReactNode }

export function IntranetSidebar({ user, urls, signInUrl, onLogout }: Props) {
  const primary = [
    { label: "Etusivu", href: urls.portal, icon: Home },
    { label: "Kuutio", href: urls.kuutio, icon: CalendarClock },
    { label: "Työaikaleimaus", href: urls.tyoaika, icon: CalendarRange },
    { label: "Työvuorosuunnitelma", href: `${urls.tyoaika}/work-schedule`, icon: CalendarDays },
  ]
  const admin = [{ label: "Käyttäjät", href: `${urls.users}/users`, icon: Users }, { label: "Palvelut", href: `${urls.users}/services`, icon: CalendarRange }]
  if (user?.admin) admin.push({ label: "Työntekijät", href: `${urls.tyoaika}/employees`, icon: Users })
  const active = (href: string) => {
    const url = new URL(href, window.location.href)
    return url.origin === window.location.origin && (url.pathname === "/" ? window.location.pathname === "/" : window.location.pathname.startsWith(url.pathname))
  }
  const links = (items: typeof primary) => <SidebarMenu>{items.map(({ label, href, icon: Icon }) => <SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={active(href)} className="h-auto min-h-10 text-sm"><a href={href} aria-current={active(href) ? "page" : undefined}><Icon aria-hidden="true" /><span className="min-w-0 whitespace-normal! break-words">{label}</span></a></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
  return <Sidebar>
    <SidebarHeader className="border-b border-sidebar-border px-5 py-5"><a href={urls.portal} className="font-display text-2xl font-bold tracking-tight">Intranet</a></SidebarHeader>
    <SidebarContent className="px-2"><nav aria-label="Intranetin valikko">
      <SidebarGroup><SidebarGroupContent>{links(primary)}</SidebarGroupContent></SidebarGroup>
      {user?.admin && <SidebarGroup><SidebarGroupLabel>Hallinto</SidebarGroupLabel><SidebarGroupContent>{links(admin)}</SidebarGroupContent></SidebarGroup>}
      <SidebarGroup><SidebarGroupLabel>Muuta</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{[{ label: "ForeAmmatti", href: "https://www.foreammatti.fi" }, { label: "Intro", href: "https://intro.elbit.fi" }, { label: "Sarastia", href: "https://www.sarastia.fi" }].map(({ label, href }) => <SidebarMenuItem key={label}><SidebarMenuButton asChild className="min-h-10"><a href={href} target="_blank" rel="noreferrer">{label}<ExternalLink className="ml-auto size-3.5 text-muted-foreground" aria-hidden="true" /></a></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
    </nav></SidebarContent>
    <SidebarFooter className="gap-3 p-4"><SidebarSeparator className="mx-0" />
      <AccountMenu user={user} usersUrl={urls.users} signInUrl={signInUrl} onLogout={onLogout} />
    </SidebarFooter>
  </Sidebar>
}

export function IntranetShell({ children, headerActions, ...props }: Props) {
  return <SidebarProvider className="font-body"><IntranetSidebar {...props} /><div className="min-w-0 flex-1"><header className="flex h-14 items-center border-b px-4 sm:px-6"><SidebarTrigger aria-label="Avaa tai sulje sivuvalikko" /><div className="ml-auto">{headerActions}</div></header>{children}</div></SidebarProvider>
}
