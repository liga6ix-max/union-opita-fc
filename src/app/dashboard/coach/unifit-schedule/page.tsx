
'use client';

import { useState, useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, CalendarDays, Users, User, Clock, MapPin } from 'lucide-react';

const MAIN_CLUB_ID = 'OpitaClub';

const createSessionId = (session: { day: string; time: string; location: string; activity: string }) => {
    return `${session.day}-${session.time}-${session.location}-${session.activity}`.replace(/[^a-zA-Z0-9-]/g, '');
};

export default function CoachUnifitSchedulePage() {
    const { firestore, isUserLoading } = useUser();
    const [today] = useState(new Date());

    const weekDates = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [today]);

    const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

    const clubConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'clubs', MAIN_CLUB_ID) : null, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitBookings`),
            where("bookingDate", "==", selectedDate)
        );
    }, [firestore, selectedDate]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
    
    const allUsersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID)) : null, [firestore]);
    const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);

    const usersMap = useMemo(() => {
        if (!allUsers) return new Map();
        return new Map(allUsers.map(u => [u.id, u]));
    }, [allUsers]);

    const isLoading = isUserLoading || clubLoading || usersLoading;
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
                        <Users /> Asistencia y Horarios UNIFIT
                    </CardTitle>
                    <CardDescription>
                        Supervisa la asistencia a las sesiones de entrenamiento funcional.
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
                                const dateDayIndex = getDay(date);
                                const sessionsForDay = schedule.filter((s: any) => dayNameToIndex(s.day) === dateDayIndex);

                                return (
                                    <TabsContent key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                                        {bookingsLoading ? (
                                            <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                        ) : sessionsForDay.length > 0 ? (
                                            <Accordion type="single" collapsible className="w-full space-y-4 mt-6">
                                                {sessionsForDay.map((session: any, index: number) => {
                                                    const sessionId = createSessionId(session);
                                                    const sessionBookings = bookings?.filter(b => b.sessionId === sessionId) || [];
                                                    
                                                    return (
                                                        <Card key={index}>
                                                            <AccordionItem value={`session-${index}`} className="border-b-0">
                                                                <AccordionTrigger className="p-6 hover:no-underline">
                                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4 text-left">
                                                                        <div className='flex-grow'>
                                                                            <h4 className="font-bold text-lg">{session.activity}</h4>
                                                                            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                                                <span className="flex items-center gap-1.5"><Clock size={16}/> {session.time}</span>
                                                                                <span className="flex items-center gap-1.5"><MapPin size={16}/> {session.location}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-semibold text-lg text-primary mt-2 md:mt-0">{sessionBookings.length} Asistentes</div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="p-6 pt-0">
                                                                    {sessionBookings.length > 0 ? (
                                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                                                            {sessionBookings.map(booking => {
                                                                                const bookingUser = usersMap.get(booking.userId);
                                                                                return (
                                                                                    <div key={booking.id} className="flex items-center gap-2">
                                                                                        <User size={16} className="text-muted-foreground"/>
                                                                                        <span>{bookingUser?.firstName} {bookingUser?.lastName}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-muted-foreground">Nadie ha reservado para esta sesión todavía.</p>
                                                                    )}
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </Card>
                                                    );
                                                })}
                                            </Accordion>
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
