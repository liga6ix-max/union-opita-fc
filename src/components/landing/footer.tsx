import { ClubLogo } from "@/components/icons"

export function Footer() {
    return (
        <footer className="bg-secondary">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <ClubLogo className="h-8 w-8 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-bold font-headline">Unión Opita FC Rivera</span>
                            <span className="text-xs text-muted-foreground">NIT 901.943.142-2</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 md:mt-0">
                        © {new Date().getFullYear()} Unión Opita FC. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    )
}
