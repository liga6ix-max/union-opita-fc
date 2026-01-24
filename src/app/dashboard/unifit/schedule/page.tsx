
'use client';

import { useState, useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarDays, MapPin, Clock, Users, User, UserX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MAIN_CLUB_ID = 'OpitaClub';
const TOTAL_SLOTS = 24;

const createSessionId = (session: { day: string; time: string; location: string; activity: string }) => {
    return `${session.day}-${session.time}-${session.location}-${session.activity}`.replace(/[^a-zA-Z0-9-]/g, '');
};

export default function UnifitSchedulePage() {
    const { user, firestore, isUserLoading } = useUser();
    const { toast } = useToast();
    const [today] = useState(new Date());

    const weekDates = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [today]);

    const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", "==", selectedDate)
        );
    }, [firestore, selectedDate]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    const handleBooking = async (session: any) => {
        if (!firestore || !user) return;

        const sessionId = createSessionId(session);
        const bookingDate = selectedDate;
        
        const existingBooking = bookings?.find(b => b.userId === user.uid && b.sessionId === sessionId);

        if (existingBooking) {
            // Cancel booking
            const bookingRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`, existingBooking.id);
            deleteDocumentNonBlocking(bookingRef);
            toast({ title: "Reserva cancelada" });
        } else {
            // Create booking
            const sessionBookings = bookings?.filter(b => b.sessionId === sessionId).length || 0;
            if (sessionBookings >= TOTAL_SLOTS) {
                toast({ variant: 'destructive', title: "Sesión llena", description: "No quedan cupos disponibles para esta sesión." });
                return;
            }
            
            const bookingsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`);
            addDocumentNonBlocking(bookingsCollection, {
                clubId: MAIN_CLUB_ID,
                userId: user.uid,
                bookingDate,
                sessionId,
            });
            toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${session.activity}.` });
        }
    };
    
    const isLoading = isUserLoading || clubLoading;
    const schedule = clubData?.unifitSchedule || [];

    const dayNameToIndex = (name: string) => {
        const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return names.indexOf(name.toLowerCase());
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarDays /> Reserva de Clases UNIFIT
                    </CardTitle>
                    <CardDescription>
                        Selecciona un día y reserva tu cupo en una de las sesiones de entrenamiento funcional.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <Tabs defaultValue={selectedDate} onValueChange={setSelectedDate} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
                                {weekDates.map(date => (
                                    <TabsTrigger key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                                        <div className="capitalize">{format(date, 'eee', { locale: es })}</div>
                                        <div className="text-xs">{format(date, 'd', { locale: es })}</div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            
                            {weekDates.map(date => {
                                const dateDayIndex = getDay(date); // Sunday is 0, Monday is 1
                                const sessionsForDay = schedule.filter((s:any) => dayNameToIndex(s.day) === dateDayIndex);
                                
                                return (
                                    <TabsContent key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                                        {bookingsLoading ? (
                                            <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                        ) : sessionsForDay.length > 0 ? (
                                            <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                                                {sessionsForDay.map((session: any, index: number) => {
                                                    const sessionId = createSessionId(session);
                                                    const sessionBookings = bookings?.filter(b => b.sessionId === sessionId) || [];
                                                    const userBooking = sessionBookings.find(b => b.userId === user?.uid);
                                                    const isFull = sessionBookings.length >= TOTAL_SLOTS;

                                                    return (
                                                        <Card key={index}>
                                                            <CardHeader>
                                                                <CardTitle>{session.activity}</CardTitle>
                                                                <div className="text-sm text-muted-foreground space-y-1 pt-2">
                                                                    <div className="flex items-center gap-2"><Clock/> {session.time}</div>
                                                                    <div className="flex items-center gap-2"><MapPin/> {session.location}</div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm font-medium">Cupos</span>
                                                                            <span className="text-sm text-muted-foreground">{sessionBookings.length} / {TOTAL_SLOTS}</span>
                                                                        </div>
                                                                        <Progress value={(sessionBookings.length / TOTAL_SLOTS) * 100} />
                                                                    </div>
                                                                     <Button className="w-full" onClick={() => handleBooking(session)} disabled={isFull && !userBooking}>
                                                                        {userBooking ? 'Cancelar Reserva' : isFull ? 'Lleno Total' : 'Reservar Plaza'}
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-center py-12 text-muted-foreground">No hay sesiones programadas para este día.</p>
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
