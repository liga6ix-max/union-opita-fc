'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, getDay, addDays } from 'date-fns';
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

    // 2. Fetch all bookings from today onwards for the next month
    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const today = format(new Date(), 'yyyy-MM-dd');
        // Let's use 31 days to be safe for a full month cycle
        const futureDate = format(addDays(new Date(), 31), 'yyyy-MM-dd');
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", ">=", today),
            where("bookingDate", "<=", futureDate)
        );
    }, [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    // The core booking/cancellation logic remains the same
    const handleBooking = async (session: any, date: Date) => {
        if (!firestore || !user || !date || !session.id) return;

        const sessionId = session.id;
        const bookingDate = format(date, 'yyyy-MM-dd');
        
        const existingBooking = bookings?.find(b => 
            b.userId === user.uid && 
            b.sessionId === sessionId &&
            b.bookingDate === bookingDate
        );

        if (existingBooking) {
            const bookingRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`, existingBooking.id);
            deleteDocumentNonBlocking(bookingRef);
            toast({ title: "Reserva cancelada" });
        } else {
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
    
    // Data processing to generate the schedule view grouped by day of the week
    const scheduleByDayOfWeek = useMemo(() => {
        const masterSchedule = clubData?.unifitSchedule || [];
        if (masterSchedule.length === 0) return [];
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        // 1. Group all upcoming session instances by the name of the day (Lunes, Martes, etc.)
        const instancesByDayName: Record<string, { date: Date; sessions: any[] }[]> = {};

        const today = new Date();
        // Generate schedule for the next 31 days (a full mesociclo)
        for (let i = 0; i < 31; i++) {
            const date = addDays(today, i);
            const dayName = dayNames[getDay(date)];
            
            // Find all master sessions scheduled for this day of the week
            const sessionsForThisDay = masterSchedule.filter((s:any) => s.day === dayName);

            if (sessionsForThisDay.length > 0) {
                if (!instancesByDayName[dayName]) {
                    instancesByDayName[dayName] = [];
                }
                // Add the specific date and its corresponding sessions
                instancesByDayName[dayName].push({
                    date: date,
                    sessions: sessionsForThisDay.sort((a,b) => a.time.localeCompare(b.time)), // Sort sessions by time
                });
            }
        }
        
        // 2. Format the data into the final structure, ordered by the day of the week
        return dayOrder
            .map(dayName => ({
                dayName,
                instances: instancesByDayName[dayName] || [],
            }))
            .filter(group => group.instances.length > 0); // Only include days that have scheduled sessions

    }, [clubData?.unifitSchedule, bookings, user]);

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
                        Selecciona las sesiones a las que deseas asistir para el próximo mes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : scheduleByDayOfWeek && scheduleByDayOfWeek.length > 0 ? (
                        scheduleByDayOfWeek.map(dayGroup => (
                             <Card key={dayGroup.dayName} className="bg-background/50">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl text-primary">{dayGroup.dayName}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {dayGroup.instances.map(instance => (
                                        <div key={instance.date.toISOString()} className="border-t pt-4 first:border-t-0">
                                            <h4 className="font-semibold text-lg">{format(instance.date, "d 'de' MMMM, yyyy", { locale: es })}</h4>
                                            <div className="grid gap-4 mt-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {instance.sessions.map(session => {
                                                    const bookingDate = format(instance.date, 'yyyy-MM-dd');
                                                    const sessionBookings = bookings?.filter(b => b.sessionId === session.id && b.bookingDate === bookingDate) || [];
                                                    const userBooking = sessionBookings.find(b => b.userId === user?.uid);
                                                    const isFull = sessionBookings.length >= TOTAL_SLOTS;

                                                    return (
                                                        <Card key={session.id} className="shadow-md">
                                                            <CardHeader>
                                                                <CardTitle className="text-base">{session.activity}</CardTitle>
                                                                <div className="text-sm text-muted-foreground space-y-1 pt-1">
                                                                    <div className="flex items-center gap-2"><Clock/> {session.time}</div>
                                                                    <div className="flex items-center gap-2"><MapPin/> {session.location}</div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-xs font-medium">Cupos</span>
                                                                            <span className="text-xs text-muted-foreground">{sessionBookings.length} / {TOTAL_SLOTS}</span>
                                                                        </div>
                                                                        <Progress value={(sessionBookings.length / TOTAL_SLOTS) * 100} />
                                                                    </div>
                                                                    <Button size="sm" className="w-full" onClick={() => handleBooking(session, instance.date)} disabled={isFull && !userBooking} variant={userBooking ? 'secondary' : 'default'}>
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
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">No hay sesiones programadas por el administrador para las próximas semanas.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
