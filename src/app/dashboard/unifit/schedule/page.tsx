'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, getDay, addDays, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, MapPin, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MAIN_CLUB_ID = 'OpitaClub';
const TOTAL_SLOTS = 20;


export default function UnifitSchedulePage() {
    const { user, firestore, isUserLoading } = useUser();
    const { toast } = useToast();

    // 1. Fetch club config (which contains the master UNIFIT schedule)
    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    // 2. Fetch all bookings from today onwards for the next 30 days
    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const today = format(new Date(), 'yyyy-MM-dd');
        const futureDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", ">=", today),
            where("bookingDate", "<=", futureDate)
        );
    }, [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    // The core booking/cancellation logic
    const handleBooking = async (session: any, date: Date) => {
        if (!firestore || !user || !date || !session.id) return;

        const sessionId = session.id;
        const bookingDate = format(date, 'yyyy-MM-dd');
        
        // Find if a booking already exists for this user, for this specific session slot, on this specific date.
        const existingBooking = bookings?.find(b => 
            b.userId === user.uid && 
            b.sessionId === sessionId &&
            b.bookingDate === bookingDate
        );

        if (existingBooking) {
            // Cancel booking
            const bookingRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`, existingBooking.id);
            deleteDocumentNonBlocking(bookingRef);
            toast({ title: "Reserva cancelada" });
        } else {
            // Create booking
            // Count current bookings for this specific session instance
            const sessionInstanceBookings = bookings?.filter(b => b.sessionId === sessionId && b.bookingDate === bookingDate).length || 0;
            if (sessionInstanceBookings >= TOTAL_SLOTS) {
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
    
    // --- Data processing to generate the schedule view ---
    const monthlySchedule = useMemo(() => {
        const masterSchedule = clubData?.unifitSchedule || [];
        if (masterSchedule.length === 0) return [];
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const scheduleByWeek: Record<string, { weekLabel: string; days: Record<string, { dayLabel: string; date: Date; sessions: any[] }> }> = {};

        const today = new Date();
        // Generate schedule for the next 30 days
        for (let i = 0; i < 30; i++) {
            const date = addDays(today, i);
            const dayIndex = getDay(date);
            const dayName = dayNames[dayIndex];
            
            const sessionsForThisDay = masterSchedule.filter((s:any) => s.day === dayName);

            if (sessionsForThisDay.length > 0) {
                const weekNumber = getWeek(date, { weekStartsOn: 1 });
                const weekLabel = `Semana del ${format(startOfWeek(date, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`;

                if (!scheduleByWeek[weekNumber]) {
                    scheduleByWeek[weekNumber] = { weekLabel, days: {} };
                }

                const dayLabel = format(date, "eeee, d 'de' MMMM", { locale: es });
                if (!scheduleByWeek[weekNumber].days[dayLabel]) {
                    scheduleByWeek[weekNumber].days[dayLabel] = { dayLabel, date, sessions: [] };
                }
                
                scheduleByWeek[weekNumber].days[dayLabel].sessions.push(...sessionsForThisDay);
            }
        }
        // Convert the object to an array of weeks, and sort days within each week
        return Object.values(scheduleByWeek).map(week => ({
            ...week,
            days: Object.values(week.days).sort((a, b) => a.date.getTime() - b.date.getTime())
        }));

    }, [clubData]);

    const isLoading = isUserLoading || clubLoading || bookingsLoading;

    if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarIcon /> Reserva de Clases UNIFIT
                    </CardTitle>
                    <CardDescription>
                        Selecciona un día y reserva tu cupo en una de las sesiones de entrenamiento funcional para el próximo mes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : monthlySchedule.length > 0 ? (
                        monthlySchedule.map(week => (
                            <div key={week.weekLabel}>
                                <h2 className="text-xl font-bold font-headline text-primary mb-4">{week.weekLabel}</h2>
                                {week.days.map(day => (
                                    <div key={day.dayLabel} className="mb-6">
                                        <h3 className="font-semibold capitalize border-b pb-2 mb-4">{day.dayLabel}</h3>
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {day.sessions.map((session, index) => {
                                                const bookingDate = format(day.date, 'yyyy-MM-dd');
                                                const sessionBookings = bookings?.filter(b => b.sessionId === session.id && b.bookingDate === bookingDate) || [];
                                                const userBooking = sessionBookings.find(b => b.userId === user?.uid);
                                                const isFull = sessionBookings.length >= TOTAL_SLOTS;

                                                return (
                                                    <Card key={`${session.id}-${index}`}>
                                                        <CardHeader>
                                                            <CardTitle>{session.activity}</CardTitle>
                                                            <div className="text-sm text-muted-foreground space-y-1 pt-2">
                                                                <div className="flex items-center gap-2"><CalendarIcon/> {format(day.date, "d 'de' MMMM", { locale: es })}</div>
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
                                                                <Button className="w-full" onClick={() => handleBooking(session, day.date)} disabled={isFull && !userBooking}>
                                                                    {userBooking ? 'Cancelar Reserva' : isFull ? 'Lleno Total' : 'Reservar Plaza'}
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">No hay sesiones programadas por el administrador.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
