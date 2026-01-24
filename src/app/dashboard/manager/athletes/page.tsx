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

    const athletesSubCollectionQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      let q = query(collection(firestore, `clubs/${MAIN_CLUB_ID}/athletes`));
      if (teamFilter) {
          q = query(q, where("team", "==", teamFilter));
      }
      return q;
    }, [firestore, teamFilter]);

    const allAthletesUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "athlete"));
    }, [firestore]);
    
    const coachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `users`), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
    }, [firestore]);
    
    const { data: athletesSubCollection, isLoading: athletesLoading } = useCollection(athletesSubCollectionQuery);
    const { data: allAthletesUsers, isLoading: usersLoading } = useCollection(allAthletesUsersQuery);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);
    
    const enabledAndEnrichedAthletes = useMemo(() => {
        if (!allAthletesUsers || !athletesSubCollection) return [];

        // 1. Filter out disabled users first
        const enabledUsers = allAthletesUsers.filter(user => !user.disabled);

        // 2. Create a map of the sub-collection data for quick lookups
        const subCollectionMap = new Map(athletesSubCollection.map(subDoc => [subDoc.id, subDoc]));

        // 3. Map over enabled users and enrich them with data from the sub-collection
        return enabledUsers.map(user => {
            const subData = subCollectionMap.get(user.id);
            return {
                ...user, // has firstName, lastName, email, id from 'users' collection
                ...subData, // has team, coachId etc. from 'athletes' sub-collection
            };
        }).filter(athlete => {
            // Apply team filter if it exists
            return teamFilter ? athlete.team === teamFilter : true;
        });

    }, [allAthletesUsers, athletesSubCollection, teamFilter]);


    if (isUserLoading || athletesLoading || coachesLoading || usersLoading) {
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
                                ? `Mostrando deportistas habilitados de la categoría: ${teamFilter}`
                                : "Mostrando todos los deportistas habilitados del club."
                            }
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtrar por Categoría</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild><Link href="/dashboard/manager/athletes">Todas las Categorías</Link></DropdownMenuItem>
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
                                <TableHead>Categoría</TableHead>
                                <TableHead>Entrenador Asignado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enabledAndEnrichedAthletes && enabledAndEnrichedAthletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.firstName} {athlete.lastName}</TableCell>
                                    <TableCell>{athlete.team || 'Sin categoría'}</TableCell>
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
                     {(!enabledAndEnrichedAthletes || enabledAndEnrichedAthletes.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">
                            {teamFilter ? `No hay deportistas habilitados en la categoría ${teamFilter}.` : "No hay deportistas habilitados registrados."}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
