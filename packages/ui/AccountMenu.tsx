import { EllipsisVertical, LogIn, LogOut, UserRound } from "lucide-react"
import { DropdownMenu as Menu } from "radix-ui"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./components/sidebar"
import type { IntranetUser } from "./IntranetShell"

export function AccountMenu({ user, usersUrl, signInUrl, onLogout }: { user?: IntranetUser | null; usersUrl: string; signInUrl: string; onLogout: () => void }) {
  const { isMobile } = useSidebar()
  const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.email || "Vierailija"
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
  const profile = <><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground" aria-hidden="true">{initials}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{name}</span><span className="block truncate text-xs text-muted-foreground">{user?.email || "Kirjaudu intranettiin"}</span></span></>
  if (!user) return <SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild className="h-auto min-h-14 px-2 py-2"><a href={signInUrl}>{profile}<LogIn className="ml-auto shrink-0" aria-hidden="true" /><span className="sr-only">Kirjaudu sisään</span></a></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  const itemClass = "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
  return <SidebarMenu><SidebarMenuItem><Menu.Root>
    <Menu.Trigger asChild><SidebarMenuButton aria-label="Avaa tilivalikko" className="h-auto min-h-14 gap-3 rounded-lg px-2 py-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">{profile}<EllipsisVertical className="ml-auto size-4 shrink-0" aria-hidden="true" /></SidebarMenuButton></Menu.Trigger>
    <Menu.Portal><Menu.Content side={isMobile ? "top" : "right"} align="end" sideOffset={8} collisionPadding={12} className="z-[60] w-64 max-w-[calc(100vw-24px)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
      <Menu.Label className="flex min-w-0 items-center gap-3 px-2 py-2 font-normal">{profile}</Menu.Label>
      <Menu.Separator className="-mx-1 my-1 h-px bg-border" />
      <Menu.Item asChild className={itemClass}><a href={`${usersUrl}/account`}><UserRound className="size-4" aria-hidden="true" />Tili</a></Menu.Item>
      <Menu.Separator className="-mx-1 my-1 h-px bg-border" />
      <Menu.Item className={itemClass} onSelect={onLogout}><LogOut className="size-4" aria-hidden="true" />Kirjaudu ulos</Menu.Item>
    </Menu.Content></Menu.Portal>
  </Menu.Root></SidebarMenuItem></SidebarMenu>
}
