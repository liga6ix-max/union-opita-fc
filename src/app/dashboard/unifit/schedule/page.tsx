'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, getDay, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, MapPin, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';


const MAIN_CLUB_ID = 'OpitaClub';
const TOTAL_SLOTS = 20;

type UnifitScheduleItem = {
    id: string;
    day: string;
    time: string;
    location: string;
    activity: string;
};

export default function UnifitSchedulePage() {
    const { user, firestore, isUserLoading } = useUser();
    const { toast } = useToast();

    // 1. Fetch club config (which contains the master UNIFIT schedule)
    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    // 2. Fetch all bookings for the next month to calculate availability
    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
        // Let's use 31 days to be safe for a full month cycle
        const futureDate = format(addDays(new Date(), 31), 'yyyy-MM-dd');
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", ">=", today),
            where("bookingDate", "<=", futureDate)
        );
    }, [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    // Booking and cancellation logic
    const handleBooking = async (session: any, date: Date) => {
        if (!firestore || !user || !date || !session.id) return;
        
        const bookingDate = format(date, 'yyyy-MM-dd');
        
        const existingBooking = bookings?.find(b => 
            b.userId === user.uid && 
            b.sessionId === session.id &&
            b.bookingDate === bookingDate
        );

        if (existingBooking) {
            const bookingRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`, existingBooking.id);
            deleteDocumentNonBlocking(bookingRef);
            toast({ title: "Reserva cancelada" });
        } else {
            const sessionInstanceBookings = bookings?.filter(b => b.sessionId === session.id && b.bookingDate === bookingDate).length || 0;
            if (sessionInstanceBookings >= TOTAL_SLOTS) {
                toast({ variant: 'destructive', title: "Sesión llena", description: "No quedan cupos disponibles para esta sesión." });
                return;
            }
            
            const bookingsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`);
            addDocumentNonBlocking(bookingsCollection, {
                clubId: MAIN_CLUB_ID,
                userId: user.uid,
                bookingDate,
                sessionId: session.id,
            });
            toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${session.activity}.` });
        }
    };
    
    const monthlySchedule = useMemo(() => {
        const masterSchedule: UnifitScheduleItem[] = clubData?.unifitSchedule || [];
        if (masterSchedule.length === 0) return [];
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        const scheduleByDay: Record<string, { date: Date; sessions: any[] }[]> = {};

        const today = startOfDay(new Date());

        for (let i = -1; i < 31; i++) { // Start from yesterday to show past sessions
            const date = addDays(today, i);
            const dayName = dayNames[getDay(date)];
            
            const sessionsForThisDay = masterSchedule
                .filter((s: any) => s.day === dayName)
                .map(s => ({
                    ...s,
                    id: s.id || `${s.day}-${s.time.replace(/\s/g, '')}`
                }));

            if (sessionsForThisDay.length > 0) {
                 if (!scheduleByDay[dayName]) {
                    scheduleByDay[dayName] = [];
                }
                scheduleByDay[dayName].push({
                    date: date,
                    sessions: sessionsForThisDay.sort((a,b) => a.time.localeCompare(b.time)),
                });
            }
        }
        
        return dayOrder
            .map(dayName => ({
                dayName,
                instances: (scheduleByDay[dayName] || []).sort((a, b) => a.date.getTime() - b.date.getTime()),
            }))
            .filter(group => group.instances.length > 0);

    }, [clubData?.unifitSchedule]);

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
                        Selecciona las sesiones a las que deseas asistir.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : monthlySchedule && monthlySchedule.length > 0 ? (
                        monthlySchedule.map(dayGroup => (
                             <Card key={dayGroup.dayName} className="bg-background/50">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl text-primary">{dayGroup.dayName}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     {dayGroup.instances.map((instance) => {
                                        const isDayPast = isBefore(instance.date, startOfDay(new Date()));
                                        
                                        return (
                                            <div key={instance.date.toISOString()} className="border-t pt-6 first:border-t-0">
                                                <h4 className="font-semibold text-lg">{format(instance.date, "EEEE, d 'de' MMMM", { locale: es })}</h4>
                                                <div className="grid gap-4 mt-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {instance.sessions.map((session) => {
                                                        const bookingDate = format(instance.date, 'yyyy-MM-dd');
                                                        const sessionBookings = bookings?.filter(b => b.sessionId === session.id && b.bookingDate === bookingDate) || [];
                                                        const userBooking = sessionBookings.find(b => b.userId === user?.uid);
                                                        const isFull = sessionBookings.length >= TOTAL_SLOTS;

                                                        return (
                                                            <Card key={`${instance.date.toISOString()}-${session.id}`} 
                                                                className={cn(
                                                                    "shadow-md", 
                                                                    isDayPast && "bg-yellow-100/50 border-yellow-200/60 dark:bg-yellow-950/30 dark:border-yellow-900/40"
                                                                )}
                                                            >
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
                                                                        <Button 
                                                                            size="sm" 
                                                                            className="w-full" 
                                                                            onClick={() => handleBooking(session, instance.date)} 
                                                                            disabled={isDayPast || (isFull && !userBooking)} 
                                                                            variant={userBooking ? 'secondary' : 'default'}
                                                                        >
                                                                            {isDayPast ? 'Finalizada' : userBooking ? 'Cancelar Reserva' : isFull ? 'Lleno Total' : 'Reservar Plaza'}
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )
                                     })}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">No hay sesiones programadas por el administrador.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}