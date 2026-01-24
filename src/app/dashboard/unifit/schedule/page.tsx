
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, MapPin, Clock, Loader2 } from 'lucide-react';

const MAIN_CLUB_ID = 'OpitaClub';

export default function UnifitSchedulePage() {
    const { firestore, isUserLoading } = useUser();

    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    const schedule = clubData?.unifitSchedule || [];
    const isLoading = isUserLoading || clubLoading;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarDays /> Horarios y Lugar
                    </CardTitle>
                    <CardDescription>
                        Estos son los horarios fijos para el programa de entrenamiento funcional UNIFIT.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : schedule.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Día</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Lugar</TableHead>
                                    <TableHead>Actividad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedule.map((session: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {session.day}</TableCell>
                                        <TableCell className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {session.time}</TableCell>
                                        <TableCell className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {session.location}</TableCell>
                                        <TableCell>{session.activity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">
                            Aún no se ha definido un horario para el programa UNIFIT.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    