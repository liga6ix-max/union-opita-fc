
'use client';
import { useState } from "react";
import { athletes, type Athlete } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ClipboardCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


export default function CoachAthletesPage() {
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const openDetailsModal = (athlete: Athlete) => {
        setSelectedAthlete(athlete);
        setIsDetailsOpen(true);
    };

    return (
        <>
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
                                    <TableCell>{athlete.medicalInfo || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => openDetailsModal(athlete)}>Ver Detalles</DropdownMenuItem>
                                                <DropdownMenuItem>Editar Información</DropdownMenuItem>
                                                <DropdownMenuItem>Añadir Evaluación</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles de {selectedAthlete?.name}</DialogTitle>
                        <DialogDescription>
                            Información completa del deportista, incluyendo evaluaciones físicas.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAthlete && (
                        <div className="space-y-6 py-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 font-headline text-lg"><ClipboardCheck /> Evaluaciones Físicas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     {selectedAthlete.physicalEvaluations.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Peso</TableHead>
                                                    <TableHead>Altura</TableHead>
                                                    <TableHead>Sprint (20m)</TableHead>
                                                    <TableHead>Salto</TableHead>
                                                    <TableHead>Resistencia</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedAthlete.physicalEvaluations.map((evalItem, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{evalItem.date}</TableCell>
                                                        <TableCell>{evalItem.weight}</TableCell>
                                                        <TableCell>{evalItem.height}</TableCell>
                                                        <TableCell>{evalItem.sprint_20m}</TableCell>
                                                        <TableCell>{evalItem.vertical_jump}</TableCell>
                                                        <TableCell>{evalItem.endurance_test}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No hay evaluaciones físicas registradas para este deportista.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
