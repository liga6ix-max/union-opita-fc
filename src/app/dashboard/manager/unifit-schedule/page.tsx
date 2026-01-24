'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, CalendarDays, Users, User, Clock, MapPin, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAIN_CLUB_ID = 'OpitaClub';

type UnifitScheduleItem = {
    day: string;
    time: string;
    location: string;
    activity: string;
};

const createSessionId = (session: UnifitScheduleItem) => {
    return `${session.day}-${session.time}-${session.location}-${session.activity}`.replace(/[^a-zA-Z0-9-]/g, '');
};

export default function ManagerUnifitSchedulePage() {
    const { firestore, isUserLoading } = useUser();
    const { toast } = useToast();
    const [today] = useState(new Date());

    const [isSavingUnifitSchedules, setIsSavingUnifitSchedules] = useState(false);
    const [unifitSchedule, setUnifitSchedule] = useState<UnifitScheduleItem[]>([]);

    const weekDates = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [today]);

    const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

    const clubConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'clubs', MAIN_CLUB_ID) : null, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

    useEffect(() => {
        if (clubData?.unifitSchedule) {
            setUnifitSchedule(clubData.unifitSchedule);
        }
    }, [clubData]);

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
    
    const handleUnifitScheduleChange = (index: number, field: keyof UnifitScheduleItem, value: string) => {
        const newSchedule = [...unifitSchedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setUnifitSchedule(newSchedule);
    };

    const handleAddUnifitSession = () => {
        setUnifitSchedule([...unifitSchedule, { day: '', time: '', location: '', activity: '' }]);
    };

    const handleRemoveUnifitSession = (index: number) => {
        const newSchedule = [...unifitSchedule];
        newSchedule.splice(index, 1);
        setUnifitSchedule(newSchedule);
    };

    const handleSaveUnifitSchedule = () => {
        if (!clubConfigRef) return;
        setIsSavingUnifitSchedules(true);
        updateDocumentNonBlocking(clubConfigRef, { unifitSchedule: unifitSchedule });
        toast({ title: "¡Horario UNIFIT Guardado!", description: "El horario del programa UNIFIT ha sido actualizado." });
        setIsSavingUnifitSchedules(false);
    };


    const isLoading = isUserLoading || clubLoading || usersLoading;
    const scheduleForViewer = clubData?.unifitSchedule || [];

    const dayNameToIndex = (name: string) => {
        const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return names.indexOf(name.toLowerCase());
    }

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                <CardTitle>Gestión de Horarios (UNIFIT)</CardTitle>
                <CardDescription>
                    Define los días, horas, lugares y actividades para el programa UNIFIT. Los cambios se reflejarán para los deportistas.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            {unifitSchedule.map((session, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-9 gap-2 items-end border-t pt-4 first:border-t-0">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Día</Label>
                                        <Select value={session.day} onValueChange={(value) => handleUnifitScheduleChange(index, 'day', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar día" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Lunes">Lunes</SelectItem>
                                                <SelectItem value="Martes">Martes</SelectItem>
                                                <SelectItem value="Miércoles">Miércoles</SelectItem>
                                                <SelectItem value="Jueves">Jueves</SelectItem>
                                                <SelectItem value="Viernes">Viernes</SelectItem>
                                                <SelectItem value="Sábado">Sábado</SelectItem>
                                                <SelectItem value="Domingo">Domingo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor={`unifit-time-${index}`}>Horario</Label>
                                        <Input id={`unifit-time-${index}`} value={session.time} onChange={(e) => handleUnifitScheduleChange(index, 'time', e.target.value)} placeholder="6-7 AM" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor={`unifit-location-${index}`}>Lugar</Label>
                                        <Input id={`unifit-location-${index}`} value={session.location} onChange={(e) => handleUnifitScheduleChange(index, 'location', e.target.value)} placeholder="Gimnasio" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor={`unifit-activity-${index}`}>Actividad</Label>
                                        <Input id={`unifit-activity-${index}`} value={session.activity} onChange={(e) => handleUnifitScheduleChange(index, 'activity', e.target.value)} placeholder="Funcional" />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveUnifitSession(index)} className="md:col-span-1 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex flex-wrap gap-4 pt-4 border-t">
                                <Button variant="outline" onClick={handleAddUnifitSession}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Sesión UNIFIT
                                </Button>
                                <Button onClick={handleSaveUnifitSchedule} disabled={isSavingUnifitSchedules}>
                                    {isSavingUnifitSchedules ? <Loader2 className="animate-spin" /> : "Guardar Horario UNIFIT"}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Users /> Asistencia por Día
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
                                const sessionsForDay = scheduleForViewer.filter((s: any) => dayNameToIndex(s.day) === dateDayIndex);

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
