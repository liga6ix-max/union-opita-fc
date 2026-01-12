

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { athletes, coaches } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ManagerAthletesPage() {
    const searchParams = useSearchParams();
    const team = searchParams.get('team');

    if (!team) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg text-muted-foreground">Selecciona un equipo desde la página de "Equipos" para ver los deportistas.</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/manager/teams">Volver a Equipos</Link>
                </Button>
            </div>
        )
    }

    const teamAthletes = athletes.filter(athlete => athlete.team === team);
    
    const getCoachName = (coachId: number) => {
        const coach = coaches.find(c => c.id === coachId);
        return coach?.name || 'No asignado';
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Deportistas en la Categoría: {team}</CardTitle>
                    <CardDescription>Lista de todos los deportistas inscritos en este equipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Entrenador Asignado</TableHead>
                                <TableHead>Contacto de Emergencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamAthletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.name}</TableCell>
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
