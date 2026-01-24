'use client';

import { useState, useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MAIN_CLUB_ID = 'OpitaClub';
const TOTAL_SLOTS = 20;

export default function UnifitSchedulePage() {
    const { user, firestore, isUserLoading } = useUser();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedDate) return null;
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", "==", format(selectedDate, 'yyyy-MM-dd'))
        );
    }, [firestore, selectedDate]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    const handleBooking = async (session: any) => {
        if (!firestore || !user || !selectedDate || !session.id) return;

        const sessionId = session.id;
        const bookingDate = format(selectedDate, 'yyyy-MM-dd');
        
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

    const sessionsForSelectedDate = useMemo(() => {
        if (!selectedDate || !schedule) return [];
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayIndex = getDay(selectedDate);
        const currentDayName = dayNames[dayIndex];
        
        return schedule.filter((s:any) => s.day === currentDayName);
    }, [selectedDate, schedule]);
    
    const handleDateChange = (amount: number) => {
      setSelectedDate(currentDate => addDays(currentDate, amount));
    };


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarIcon /> Reserva de Clases UNIFIT
                    </CardTitle>
                    <CardDescription>
                        Selecciona un día y reserva tu cupo en una de las sesiones de entrenamiento funcional.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h3 className="text-lg font-semibold text-center font-headline capitalize w-64">
                                    {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
                                </h3>
                                <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="mt-6">
                                {bookingsLoading ? (
                                    <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : sessionsForSelectedDate.length > 0 ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {sessionsForSelectedDate.map((session, index) => {
                                            const sessionBookings = bookings?.filter(b => b.sessionId === session.id) || [];
                                            const userBooking = sessionBookings.find(b => b.userId === user?.uid);
                                            const isFull = sessionBookings.length >= TOTAL_SLOTS;

                                            return (
                                                <Card key={session.id || index}>
                                                    <CardHeader>
                                                        <CardTitle>{session.activity}</CardTitle>
                                                        <div className="text-sm text-muted-foreground space-y-1 pt-2">
                                                            {selectedDate && <div className="flex items-center gap-2"><CalendarIcon/> {format(selectedDate, "d 'de' MMMM", { locale: es })}</div>}
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
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
