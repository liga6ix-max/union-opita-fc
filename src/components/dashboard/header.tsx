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
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { RoleSwitcher } from "./role-switcher";

const pageTitles: { [key: string]: string } = {
  "/dashboard/manager": "Resumen del Gerente",
  "/dashboard/manager/landing": "Gestión Página de Inicio",
  "/dashboard/manager/settings": "Configuración del Club",
  "/dashboard/coach": "Resumen del Entrenador",
  "/dashboard/coach/athletes": "Mis Deportistas",
  "/dashboard/coach/tasks": "Mis Tareas",
  "/dashboard/athlete": "Mis Pagos",
  "/dashboard/athlete/profile": "Mi Perfil",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const role = useRole();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold font-headline">{title}</h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <RoleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Avatar>
                <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="Avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta ({role})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/athlete/profile?role=${role}`}><User className="mr-2" /> Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/"><LogOut className="mr-2" /> Cerrar Sesión</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
