
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const MAIN_CLUB_ID = 'OpitaClub';

type ScheduleItem = {
    day: string;
    time: string;
    location: string;
    activity: string;
};

export default function CoachUnifitSchedulePage() {
    const { toast } = useToast();
    const { firestore, isUserLoading } = useUser();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);
    
    useEffect(() => {
        if (clubData?.unifitSchedule) {
            setSchedule(clubData.unifitSchedule);
        }
    }, [clubData]);

    const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const handleAddSession = () => {
        setSchedule([...schedule, { day: '', time: '', location: '', activity: '' }]);
    };

    const handleRemoveSession = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        setSchedule(newSchedule);
    };

    const handleSaveSchedule = () => {
        if (!clubConfigRef) return;
        setIsSaving(true);
        updateDocumentNonBlocking(clubConfigRef, { unifitSchedule: schedule });
        toast({ title: "¡Horario Guardado!", description: "El horario del programa UNIFIT ha sido actualizado." });
        setIsSaving(false);
    };

    const isLoading = isUserLoading || clubLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarDays /> Gestionar Horario UNIFIT
                    </CardTitle>
                    <CardDescription>
                        Define los días, horas, lugares y actividades para el programa de entrenamiento funcional UNIFIT.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {schedule.map((session, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-9 gap-2 items-end border-t pt-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`day-${index}`}>Día</Label>
                                <Input id={`day-${index}`} value={session.day} onChange={(e) => handleScheduleChange(index, 'day', e.target.value)} placeholder="Ej: Lunes" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`time-${index}`}>Horario</Label>
                                <Input id={`time-${index}`} value={session.time} onChange={(e) => handleScheduleChange(index, 'time', e.target.value)} placeholder="6-7 AM" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`location-${index}`}>Lugar</Label>
                                <Input id={`location-${index}`} value={session.location} onChange={(e) => handleScheduleChange(index, 'location', e.target.value)} placeholder="Gimnasio Principal" />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`activity-${index}`}>Actividad</Label>
                                <Input id={`activity-${index}`} value={session.activity} onChange={(e) => handleScheduleChange(index, 'activity', e.target.value)} placeholder="Funcional General" />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSession(index)} className="md:col-span-1 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                         <Button variant="outline" onClick={handleAddSession}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Sesión
                        </Button>
                        <Button onClick={handleSaveSchedule} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : "Guardar Horario"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    