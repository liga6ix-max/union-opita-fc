

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ClubLogo } from "@/components/icons";
import { useUser } from "@/firebase";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  LogOut,
  User,
  ListTodo,
  Settings,
  ImageIcon,
  CalendarClock,
  UserCheck,
  Shield,
  BarChart3,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useFirebase } from "@/firebase";

const managerNav = [
  { href: "/dashboard/manager", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/manager/reports", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/manager/athletes", label: "Deportistas", icon: Users },
  { href: "/dashboard/manager/teams", label: "Equipos", icon: Shield },
  { href: "/dashboard/manager/approvals", label: "Aprobaciones", icon: UserPlus },
  { href: "/dashboard/manager/tasks", label: "Tareas", icon: ClipboardList },
  { href: "/dashboard/manager/planning", label: "Planificación", icon: CalendarClock },
  { href: "/dashboard/manager/payments", label: "Pagos", icon: Wallet },
  { href: "/dashboard/manager/landing", label: "Página Inicio", icon: ImageIcon },
  { href: "/dashboard/manager/settings", label: "Configuración", icon: Settings },
];

const coachNav = [
    { href: "/dashboard/coach", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/coach/athletes", label: "Mis Deportistas", icon: Users },
    { href: "/dashboard/coach/planning", label: "Planificación", icon: CalendarClock },
    { href: "/dashboard/coach/tasks", label: "Mis Tareas", icon: ListTodo },
    { href: "/dashboard/coach/attendance", label: "Asistencia", icon: UserCheck },
    { href: "/dashboard/coach/profile", label: "Mi Perfil", icon: User },
];

const athleteNav = [
    { href: "/dashboard/athlete/profile", label: "Mi Perfil", icon: User },
];

const navItems = {
  manager: managerNav,
  coach: coachNav,
  athlete: athleteNav,
};

export function DashboardSidebar() {
  const { profile, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = useFirebase();

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login'); // Immediate redirection
    }
  };

  const role = profile?.role;

  if (isUserLoading) {
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <ClubLogo className="size-8 text-primary" />
                    <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
                        Cargando...
                    </span>
                </div>
            </SidebarHeader>
            <SidebarMenu className="flex-1 justify-center items-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </SidebarMenu>
        </Sidebar>
    );
  }
  
  if (role === 'pending') {
     return (
        <Sidebar>
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-2">
                    <ClubLogo className="size-8 text-primary" />
                    <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
                        Unión Opita FC
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarMenu>
                 <div className="p-4 text-center text-sm text-muted-foreground">
                    Tu cuenta está pendiente de aprobación por un administrador.
                 </div>
            </SidebarMenu>
            <SidebarFooter className="mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                            <LogOut />
                            <span>Cerrar Sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
     );
  }

  const currentNav = navItems[role] || [];

  const isLinkActive = (href: string) => {
    if (href.endsWith('/manager') || href.endsWith('/coach') || href.endsWith('/athlete')) {
        return pathname === href;
    }
     if (href.endsWith('/athlete/profile')) {
        return pathname.startsWith('/dashboard/athlete');
    }
    return pathname.startsWith(href);
  };


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
              isActive={isLinkActive(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
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
                <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                    <LogOut />
                    <span>Cerrar Sesión</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
