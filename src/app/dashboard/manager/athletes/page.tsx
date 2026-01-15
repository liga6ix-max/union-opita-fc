'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, MoreVertical, Pencil, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import clubConfig from '@/lib/club-config.json';

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerAthletesPage() {
    const searchParams = useSearchParams();
    const teamFilter = searchParams.get('team');
    const { profile, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const athletesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      let q = query(collection(firestore, `clubs/${MAIN_CLUB_ID}/athletes`));
      if (teamFilter) {
          q = query(q, where("team", "==", teamFilter));
      }
      return q;
    }, [firestore, teamFilter]);
    const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);

    const coachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `users`), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
    }, [firestore]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    if (isUserLoading || athletesLoading || coachesLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const getCoachName = (coachId: string) => {
        if (!coaches || !coachId) return 'No asignado';
        const coach = coaches.find(c => c.id === coachId);
        return coach?.firstName ? `${coach.firstName} ${coach.lastName}` : 'No asignado';
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Gestión de Deportistas</CardTitle>
                        <CardDescription>
                            {teamFilter 
                                ? `Mostrando deportistas del equipo: ${teamFilter}`
                                : "Mostrando todos los deportistas del club."
                            }
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtrar por Equipo</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild><Link href="/dashboard/manager/athletes">Todos los Equipos</Link></DropdownMenuItem>
                            {clubConfig.categories.map(cat => (
                                <DropdownMenuItem key={cat.name} asChild>
                                    <Link href={`/dashboard/manager/athletes?team=${cat.name}`}>{cat.name}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Entrenador Asignado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athletes && athletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.firstName} {athlete.lastName}</TableCell>
                                    <TableCell>{athlete.team || 'Sin equipo'}</TableCell>
                                    <TableCell>{getCoachName(athlete.coachId)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/manager/athletes/${athlete.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar Perfil
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!athletes || athletes.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">
                            {teamFilter ? `No hay deportistas en el equipo ${teamFilter}.` : "No hay deportistas registrados."}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
