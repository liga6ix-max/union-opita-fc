
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function ManagerAthletesPage() {
    const searchParams = useSearchParams();
    const team = searchParams.get('team');
    const { profile, firestore, isUserLoading } = useUser();

    const teamAthletesQuery = useMemoFirebase(() => {
      if (!firestore || !profile?.clubId || !team) return null;
      return query(collection(firestore, `clubs/${profile.clubId}/athletes`), where("team", "==", team));
    }, [firestore, profile?.clubId, team]);
    const { data: teamAthletes, isLoading: athletesLoading } = useCollection(teamAthletesQuery);

    const coachesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId) return null;
        return query(collection(firestore, `users`), where("clubId", "==", profile.clubId), where("role", "==", "coach"));
    }, [firestore, profile?.clubId]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    if (isUserLoading || athletesLoading || coachesLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

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

    const getCoachName = (coachId: string) => {
        const coach = coaches?.find(c => c.id === coachId);
        return coach?.firstName ? `${coach.firstName} ${coach.lastName}` : 'No asignado';
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
                            {teamAthletes && teamAthletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.firstName} {athlete.lastName}</TableCell>
                                    <TableCell>{getCoachName(athlete.coachId)}</TableCell>
                                    <TableCell>{athlete.emergencyContactName} - {athlete.emergencyContactPhone}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!teamAthletes || teamAthletes.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">No hay deportistas en este equipo.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
