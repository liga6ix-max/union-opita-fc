
'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, User, Activity, Calendar } from 'lucide-react';

const MAIN_CLUB_ID = 'OpitaClub';

export default function UnifitAthleteDashboardPage() {
    const { profile, user, isUserLoading, firestore } = useUser();
    
    // Data fetching for the athlete's own data
    const unifitProfileDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`, user.uid);
    }, [firestore, user?.uid]);
    const { data: unifitProfile, isLoading: profileLoading } = useDoc(unifitProfileDocRef);

    const measurementsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${user.uid}/measurements`), orderBy('date', 'desc'));
    }, [firestore, user?.uid]);
    const { data: measurements, isLoading: measurementsLoading } = useCollection(measurementsQuery);
    
    const coachDocRef = useMemoFirebase(() => {
        if (!firestore || !unifitProfile?.coachId) return null;
        return doc(firestore, 'users', unifitProfile.coachId);
    }, [firestore, unifitProfile?.coachId]);
    const { data: coach, isLoading: coachLoading } = useDoc(coachDocRef);

    const isLoading = isUserLoading || profileLoading || measurementsLoading || coachLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Mi Progreso UNIFIT</CardTitle>
                    <CardDescription>
                        Entrenador Asignado: <span className="font-semibold">{coach ? `${coach.firstName} ${coach.lastName}` : 'Ninguno'}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Calendar/> Historial de Mediciones</CardTitle>
                    <CardDescription>Tu evolución a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead>Altura</TableHead>
                                <TableHead>Cintura</TableHead>
                                <TableHead>Espalda</TableHead>
                                <TableHead>B. Derecho</TableHead>
                                <TableHead>B. Izquierdo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {measurements?.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.date ? format(m.date.toDate(), "d MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
                                    <TableCell>{m.weight || '-'} kg</TableCell>
                                    <TableCell>{m.height || '-'} cm</TableCell>
                                    <TableCell>{m.waist || '-'} cm</TableCell>
                                    <TableCell>{m.back || '-'} cm</TableCell>
                                    <TableCell>{m.armRight || '-'} cm</TableCell>
                                    <TableCell>{m.armLeft || '-'} cm</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {(!measurements || measurements.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">No tienes mediciones registradas todavía.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
