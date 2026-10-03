import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  ExternalLinkIcon,
  HomeIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { kuutioWebUrl, tyoaikaWebUrl, usersWebUrl } from "@/config"
import useStore from "@/store"

const primaryLinks = [
  { label: "Etusivu", href: "/", icon: HomeIcon },
  { label: "Kuutio", href: kuutioWebUrl, icon: CalendarClockIcon },
  { label: "Työaikaleimaus", href: tyoaikaWebUrl, icon: CalendarRangeIcon },
  { label: "Työvuorosuunnitelma", href: `${tyoaikaWebUrl}/work-schedule`, icon: CalendarDaysIcon },
]

const adminLinks = [
  { label: "Käyttäjät", href: `${usersWebUrl}/users` },
  { label: "Palvelut", href: `${usersWebUrl}/services` },
]

const otherLinks = [
  { label: "ForeAmmatti", href: "https://www.foreammatti.fi" },
  { label: "Intro", href: "https://intro.elbit.fi" },
  { label: "Sarastia", href: "https://www.sarastia.fi" },
]

export function PortalSidebar() {
  const user = useStore((state) => state.user)
  const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.email || "Vierailija"
  const initials = String(name).split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-5 py-5">
        <a href="/" className="font-display text-2xl font-bold tracking-tight text-sidebar-foreground">
          Intranet
        </a>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <nav aria-label="Intranetin valikko">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryLinks.map(({ label, href, icon: Icon }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild isActive={href === "/"} className="h-auto min-h-10 rounded-md text-sm font-medium">
                      <a href={href}>
                        <Icon className="shrink-0" aria-hidden="true" />
                        <span className="min-w-0 whitespace-normal! break-words leading-5">
                          {label}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user?.admin && <SidebarGroup>
            <SidebarGroupLabel>Hallinto</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminLinks.map(({ label, href }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild className="min-h-9 rounded-md text-sm">
                      <a href={href}>{label}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

          <SidebarGroup>
            <SidebarGroupLabel>Muuta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {otherLinks.map(({ label, href }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild className="min-h-9 rounded-md text-sm">
                      <a href={href} target="_blank" rel="noreferrer">{label}<ExternalLinkIcon className="ml-auto size-3.5 text-muted-foreground" aria-hidden="true" /></a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4">
        <SidebarSeparator className="mx-0" />
        <div className="flex min-w-0 items-center gap-3 px-2">
          <Avatar className="size-9 border border-sidebar-border"><AvatarFallback className="bg-sidebar-accent font-semibold text-sidebar-accent-foreground">{initials}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || "Kirjaudu sisään"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
