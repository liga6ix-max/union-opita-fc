
'use client';

import { useState, useMemo } from 'react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type AttendanceRecord = Record<string, boolean>; // { [athleteId]: isPresent }

export default function CoachAttendancePage() {
  const { toast } = useToast();
  const { profile, firestore, isUserLoading } = useUser();

  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [attendance, setAttendance] = useState<AttendanceRecord>({});

  const trainingEventsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId || !profile.id) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/trainingEvents`), where("coachId", "==", profile.id));
  }, [firestore, profile?.clubId, profile?.id]);

  const { data: trainingEvents, isLoading: eventsLoading } = useCollection(trainingEventsQuery);

  const selectedEvent = useMemo(() => {
    return trainingEvents?.find(e => e.id === selectedEventId);
  }, [trainingEvents, selectedEventId]);

  const athletesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId || !selectedEvent?.team) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/athletes`), where("team", "==", selectedEvent.team));
  }, [firestore, profile?.clubId, selectedEvent?.team]);
  
  const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);

  const handleAttendanceChange = (athleteId: string, isPresent: boolean) => {
    setAttendance(prev => ({
        ...prev,
        [athleteId]: isPresent
    }));
  };

  const handleSaveAttendance = async () => {
    if(!selectedEventId || !firestore || !profile?.clubId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona una sesión."
        });
        return;
    }
    
    const attendanceRef = collection(firestore, `clubs/${profile.clubId}/attendance`);
    
    const attendanceData = {
        eventId: selectedEventId,
        date: selectedEvent?.date,
        coachId: profile.id,
        team: selectedEvent?.team,
        attendance: attendance,
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(attendanceRef, attendanceData);
        toast({
            title: "¡Asistencia Guardada!",
            description: `Se ha registrado la asistencia para la sesión seleccionada.`
        });
    } catch (error) {
        console.error("Error saving attendance: ", error);
        toast({
            variant: 'destructive',
            title: "Error al guardar",
            description: "No se pudo guardar la asistencia."
        })
    }
  }

  if (isUserLoading || eventsLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserCheck /> Registro de Asistencia
          </CardTitle>
          <CardDescription>
            Selecciona una sesión de entrenamiento programada y marca la asistencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainingEvents && trainingEvents.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Select onValueChange={setSelectedEventId} value={selectedEventId}>
                  <SelectTrigger className="w-full sm:w-[380px]">
                    <SelectValue placeholder="Selecciona una sesión de entrenamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {format(new Date(event.date), "PPP", { locale: es })} a las {event.time} - {event.team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSaveAttendance} className="w-full sm:w-auto" disabled={!selectedEventId || athletesLoading}>
                    {athletesLoading ? <Loader2 className="animate-spin" /> : "Guardar Asistencia"}
                </Button>
              </div>

              {selectedEvent && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Deportistas del Equipo: {selectedEvent.team}
                  </h3>
                   <div className="border rounded-lg">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[100px]"></TableHead>
                            <TableHead>Nombre del Deportista</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athletesLoading ? (
                                <TableRow><TableCell colSpan={2} className="text-center"><Loader2 className="animate-spin" /></TableCell></TableRow>
                            ) : athletes && athletes.length > 0 ? (
                                athletes.map(athlete => (
                                    <TableRow key={athlete.id}>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                id={`athlete-${athlete.id}`}
                                                checked={attendance[athlete.id] || false}
                                                onCheckedChange={(checked) => handleAttendanceChange(athlete.id, !!checked)}
                                                aria-label={`Marcar asistencia para ${athlete.firstName}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <label htmlFor={`athlete-${athlete.id}`} className="cursor-pointer">
                                                {athlete.firstName} {athlete.lastName}
                                            </label>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No hay deportistas asignados a este equipo.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No tienes sesiones de entrenamiento programadas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
