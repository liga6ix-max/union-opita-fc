import { athletes } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CoachAthletesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Gestión de Deportistas</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead>Contacto de Emergencia</TableHead>
                            <TableHead>Info. Médica</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {athletes.map(athlete => (
                            <TableRow key={athlete.id}>
                                <TableCell className="font-medium">{athlete.name}</TableCell>
                                <TableCell>{athlete.team}</TableCell>
                                <TableCell>{athlete.emergencyContact}</TableCell>
                                <TableCell>{athlete.medicalInfo}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                                            <DropdownMenuItem>Editar Información</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
