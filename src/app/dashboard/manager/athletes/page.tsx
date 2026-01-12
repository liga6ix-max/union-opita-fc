
'use client';

import { athletes, coaches } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const totalAthletes = athletes.length;
const totalCoaches = coaches.length;

export default function ManagerAthletesPage() {

    const getCoachName = (coachId: number) => {
        const coach = coaches.find(c => c.id === coachId);
        return coach?.name || 'No asignado';
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deportistas</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAthletes}</div>
                        <p className="text-xs text-muted-foreground">Miembros activos en el club</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entrenadores</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCoaches}</div>
                        <p className="text-xs text-muted-foreground">Personal dirigiendo equipos</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Lista General de Deportistas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Equipo / Categoría</TableHead>
                                <TableHead>Entrenador Asignado</TableHead>
                                <TableHead>Contacto de Emergencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.name}</TableCell>
                                    <TableCell>{athlete.team}</TableCell>
                                    <TableCell>{getCoachName(athlete.coachId)}</TableCell>
                                    <TableCell>{athlete.emergencyContact}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
