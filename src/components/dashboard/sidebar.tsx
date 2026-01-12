
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ClubLogo } from "@/components/icons";
import { useRole, type Role } from "@/hooks/use-role";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  LogOut,
  User,
  ListTodo,
  Settings,
  Image as ImageIcon,
} from "lucide-react";

const managerNav = [
  { href: "/dashboard/manager", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/manager/athletes", label: "Deportistas", icon: Users },
  { href: "/dashboard/manager/tasks", label: "Tareas", icon: ClipboardList },
  { href: "/dashboard/manager/payments", label: "Pagos", icon: Wallet },
  { href: "/dashboard/manager/landing", label: "Página Inicio", icon: ImageIcon },
  { href: "/dashboard/manager/settings", label: "Configuración", icon: Settings },
];

const coachNav = [
    { href: "/dashboard/coach", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/coach/athletes", label: "Mis Deportistas", icon: Users },
    { href: "/dashboard/coach/tasks", label: "Mis Tareas", icon: ListTodo },
    { href: "/dashboard/coach/profile", label: "Mi Perfil", icon: User },
];

const athleteNav = [
    { href: "/dashboard/athlete", label: "Mis Pagos", icon: Wallet },
    { href: "/dashboard/athlete/profile", label: "Mi Perfil", icon: User },
];

const navItems: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  manager: managerNav,
  coach: coachNav,
  athlete: athleteNav,
};

export function DashboardSidebar() {
  const role = useRole();
  const pathname = usePathname();
  const currentNav = navItems[role] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
            <ClubLogo className="size-8 text-primary group-data-[collapsible=icon]:size-6" />
            <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
                Unión Opita FC
            </span>
        </Link>
      </SidebarHeader>
      <SidebarMenu>
        {currentNav.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard/manager' || pathname === '/dashboard/manager') && (item.href !== '/dashboard/coach' || pathname === '/dashboard/coach') && (item.href !== '/dashboard/athlete' || pathname === '/dashboard/athlete')}
              tooltip={item.label}
            >
              <Link href={`${item.href}?role=${role}`}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cerrar Sesión">
                    <Link href="/">
                        <LogOut />
                        <span>Cerrar Sesión</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
