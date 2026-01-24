
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, MoreVertical, Pencil, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerUnifitPage() {
    const { profile: currentUserProfile, isUserLoading, firestore } = useUser();

    const unifitUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "unifit"));
    }, [firestore]);

    const unifitProfilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`);
    }, [firestore]);
    
    const coachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
    }, [firestore]);

    const { data: unifitUsers, isLoading: usersLoading } = useCollection(unifitUsersQuery);
    const { data: unifitProfiles, isLoading: profilesLoading } = useCollection(unifitProfilesQuery);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    const enrichedUnifitMembers = useMemo(() => {
        if (!unifitUsers || !unifitProfiles) return [];

        const profilesMap = new Map(unifitProfiles.map(p => [p.id, p]));

        return unifitUsers.map(user => {
            const profileData = profilesMap.get(user.id);
            return {
                ...user,
                coachId: profileData?.coachId,
            };
        });
    }, [unifitUsers, unifitProfiles]);

    const getCoachName = (coachId: string) => {
        if (!coaches || !coachId) return 'No asignado';
        const coach = coaches.find(c => c.id === coachId);
        return coach ? `${coach.firstName} ${coach.lastName}` : 'No asignado';
    }
    
    const isLoading = isUserLoading || usersLoading || profilesLoading || coachesLoading;

    if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Deportistas UNIFIT</CardTitle>
                    <CardDescription>
                        Gestiona los deportistas del programa de entrenamiento funcional.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Entrenador Asignado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrichedUnifitMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{getCoachName(member.coachId)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/dashboard/manager/unifit/${member.id}`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!enrichedUnifitMembers || enrichedUnifitMembers.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">
                            No hay deportistas en el programa UNIFIT.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
