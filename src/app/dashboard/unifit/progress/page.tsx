
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
                    <CardTitle className="font-headline">Mis Medidas</CardTitle>
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
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Peso</TableHead>
                                    <TableHead>% Grasa</TableHead>
                                    <TableHead>Hombros</TableHead>
                                    <TableHead>Pecho</TableHead>
                                    <TableHead>Espalda</TableHead>
                                    <TableHead>Cintura</TableHead>
                                    <TableHead>Cadera</TableHead>
                                    <TableHead>B. Der.</TableHead>
                                    <TableHead>B. Izq.</TableHead>
                                    <TableHead>P. Der.</TableHead>
                                    <TableHead>P. Izq.</TableHead>
                                    <TableHead>G. Der.</TableHead>
                                    <TableHead>G. Izq.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {measurements?.map(m => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.date ? format(m.date.toDate(), "d MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
                                        <TableCell>{m.weight ? `${m.weight} kg` : '-'}</TableCell>
                                        <TableCell>{m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '-'}</TableCell>
                                        <TableCell>{m.shoulders ? `${m.shoulders} cm` : '-'}</TableCell>
                                        <TableCell>{m.chest ? `${m.chest} cm` : '-'}</TableCell>
                                        <TableCell>{m.back ? `${m.back} cm` : '-'}</TableCell>
                                        <TableCell>{m.waist ? `${m.waist} cm` : '-'}</TableCell>
                                        <TableCell>{m.hip ? `${m.hip} cm` : '-'}</TableCell>
                                        <TableCell>{m.armRight ? `${m.armRight} cm` : '-'}</TableCell>
                                        <TableCell>{m.armLeft ? `${m.armLeft} cm` : '-'}</TableCell>
                                        <TableCell>{m.legRight ? `${m.legRight} cm` : '-'}</TableCell>
                                        <TableCell>{m.legLeft ? `${m.legLeft} cm` : '-'}</TableCell>
                                        <TableCell>{m.calfRight ? `${m.calfRight} cm` : '-'}</TableCell>
                                        <TableCell>{m.calfLeft ? `${m.calfLeft} cm` : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {(!measurements || measurements.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">No tienes mediciones registradas todavía.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    