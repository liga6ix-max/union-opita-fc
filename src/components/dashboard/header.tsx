

"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useFirebase } from "@/firebase";

const pageTitles: { [key: string]: string } = {
  "/dashboard/manager": "Resumen del Gerente",
  "/dashboard/manager/reports": "Reportes y Analíticas",
  "/dashboard/manager/teams": "Gestión de Equipos",
  "/dashboard/manager/athletes": "Deportistas por Equipo",
  "/dashboard/manager/tasks": "Gestión de Tareas",
  "/dashboard/manager/planning": "Planificación (IA)",
  "/dashboard/manager/evaluations": "Evaluaciones Psicológicas",
  "/dashboard/manager/payments": "Gestión de Pagos",
  "/dashboard/manager/approvals": "Aprobación de Usuarios",
  "/dashboard/manager/landing": "Gestión Página de Inicio",
  "/dashboard/manager/settings": "Configuración del Club",
  "/dashboard/manager/unifit": "Gestión de UNIFIT",
  "/dashboard/manager/unifit-schedule": "Gestionar Horario UNIFIT",
  "/dashboard/manager/underwater-activities": "Actividades Subacuáticas",
  "/dashboard/coach": "Resumen del Entrenador",
  "/dashboard/coach/athletes": "Mis Deportistas",
  "/dashboard/coach/tasks": "Mis Tareas",
  "/dashboard/coach/planning": "Mi Planificación",
  "/dashboard/coach/attendance": "Registro de Asistencia",
  "/dashboard/coach/profile": "Mi Perfil",
  "/dashboard/coach/unifit": "Deportistas UNIFIT",
  "/dashboard/coach/unifit-schedule": "Gestionar Horario UNIFIT",
  "/dashboard/coach/underwater-activities": "Actividades Subacuáticas",
  "/dashboard/athlete": "Mis Pagos",
  "/dashboard/athlete/profile": "Mi Perfil",
  "/dashboard/athlete/evaluations": "Mis Evaluaciones",
  "/dashboard/unifit/athletes": "Deportistas UNIFIT",
};

const getDynamicTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard/manager/athletes/')) {
    return "Perfil del Deportista (Gerente)";
  }
  if (pathname.startsWith('/dashboard/coach/athletes/')) {
    return "Perfil del Deportista (Entrenador)";
  }
  if (pathname.startsWith('/dashboard/unifit/athletes/')) {
    return "Perfil del Deportista (UNIFIT)";
  }
   if (pathname.startsWith('/dashboard/manager/unifit/')) {
    return "Perfil UNIFIT (Gerente)";
  }
  if (pathname.startsWith('/dashboard/coach/unifit/')) {
    return "Perfil UNIFIT (Entrenador)";
  }
  return pageTitles[pathname] || "Dashboard";
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const title = getDynamicTitle(pathname);

  const getProfileLink = () => {
    if (!profile?.role) return "#";
    if (profile.role === 'manager') return `/dashboard/manager/settings`;
    return `/dashboard/${profile.role}/profile`;
  }

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login'); // Immediate redirection
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold font-headline">{title}</h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {isUserLoading ? (
            <Loader2 className="animate-spin" />
        ) : profile ? (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
                >
                <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${profile?.id || 'user'}/100/100`} alt="Avatar" />
                    <AvatarFallback>{profile?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta ({profile?.role})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={getProfileLink()}><User className="mr-2" /> Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2" /> Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
