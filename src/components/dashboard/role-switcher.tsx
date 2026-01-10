"use client"

import { useRouter, usePathname } from "next/navigation"
import { useRole, type Role } from "@/hooks/use-role"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"

const roleRedirects: Record<Role, string> = {
    manager: '/dashboard/manager',
    coach: '/dashboard/coach',
    athlete: '/dashboard/athlete'
}

const roleLabels: Record<Role, string> = {
    manager: 'Gerente',
    coach: 'Entrenador',
    athlete: 'Deportista'
}

export function RoleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const role = useRole()

  const handleRoleChange = (newRole: string) => {
    if (role !== newRole) {
      const targetPath = roleRedirects[newRole as Role] || pathname
      router.push(`${targetPath}?role=${newRole}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[150px] justify-between">
          {roleLabels[role]}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={handleRoleChange}
        >
          <DropdownMenuRadioItem value="manager">{roleLabels.manager}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="coach">{roleLabels.coach}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="athlete">{roleLabels.athlete}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
