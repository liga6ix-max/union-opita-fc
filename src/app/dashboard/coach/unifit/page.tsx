'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Pencil, HeartPulse } from 'lucide-react';

const MAIN_CLUB_ID = 'OpitaClub';

export default function CoachUnifitPage() {
    const { profile, isUserLoading, firestore } = useUser();

    // 1. Get all UNIFIT profiles assigned to this coach
    const assignedProfilesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.id) return null;
        return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`), where("coachId", "==", profile.id));
    }, [firestore, profile?.id]);
    const { data: assignedProfiles, isLoading: profilesLoading } = useCollection(assignedProfilesQuery);

    // 2. Get all users in the club to find their names
    const allUsersQuery = useMemoFirebase(() => {
        if (!firestore || !profile) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID));
    }, [firestore, profile]);
    const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);


    // 3. Merge the two datasets
    const enrichedMembers = useMemo(() => {
        if (!assignedProfiles || !allUsers) return [];

        const usersMap = new Map(allUsers.map(u => [u.id, u]));

        return assignedProfiles.map(p => {
            const userData = usersMap.get(p.id);
            return {
                id: p.id,
                firstName: userData?.firstName || 'Deportista',
                lastName: userData?.lastName || 'Sin Nombre',
            };
        });
    }, [assignedProfiles, allUsers]);

    const isLoading = isUserLoading || profilesLoading || usersLoading;

    if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <HeartPulse /> Deportistas UNIFIT a mi Cargo
                    </CardTitle>
                    <CardDescription>
                        Gestiona las mediciones y el progreso de los deportistas de entrenamiento funcional que te han sido asignados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrichedMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/dashboard/coach/unifit/${member.id}`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!enrichedMembers || enrichedMembers.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">
                            No tienes deportistas del programa UNIFIT asignados.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
