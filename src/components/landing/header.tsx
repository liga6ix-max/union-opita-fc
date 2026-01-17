"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClubLogo } from "@/components/icons"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"

const navLinks = [
    { href: "#", label: "Inicio" },
    { href: "#events", label: "Eventos" },
    { href: "#news", label: "Noticias" },
]

export function Header() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
            <ClubLogo className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
                Unión Opita FC
            </span>
        </Link>
        <nav className="hidden md:flex md:items-center md:gap-6 text-sm font-medium">
            {navLinks.map(link => (
                <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
            </Button>
            {isClient && (
              <Sheet>
                  <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden">
                          <Menu />
                          <span className="sr-only">Toggle Menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                      <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                      <Link href="/" className="flex items-center space-x-2 mb-4">
                          <ClubLogo className="h-8 w-8 text-primary" />
                          <span className="font-bold font-headline">
                              Unión Opita FC
                          </span>
                      </Link>
                      {navLinks.map(link => (
                          <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                              {link.label}
                          </Link>
                      ))}
                      </nav>
                  </SheetContent>
              </Sheet>
            )}
        </div>
      </div>
    </header>
  )
}
