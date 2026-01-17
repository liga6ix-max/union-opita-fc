
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
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
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

type AttendanceRecord = Record<string, boolean>; // { [athleteId]: isPresent }

export default function CoachAttendancePage() {
  const { toast } = useToast();
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>();
  const [selectedDay, setSelectedDay] = useState<string | undefined>();
  const [attendance, setAttendance] = useState<AttendanceRecord>({});

  const microcyclesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.id || !profile?.clubId) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/microcycles`), where("coachId", "==", profile.id));
  }, [firestore, profile?.id, profile?.clubId]);

  const { data: trainingCycles, isLoading: cyclesLoading } = useCollection(microcyclesQuery);

  const selectedCycle = useMemo(() => {
    return trainingCycles?.find(c => c.id === selectedCycleId);
  }, [trainingCycles, selectedCycleId]);
  
  const selectedSession = useMemo(() => {
    return selectedCycle?.sessions.find((s:any) => s.day === selectedDay);
  }, [selectedCycle, selectedDay]);

  const athletesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId || !selectedCycle?.team) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/athletes`), where("team", "==", selectedCycle.team));
  }, [firestore, profile?.clubId, selectedCycle?.team]);
  
  const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);
  
  // Reset states when cycle selection changes
  useEffect(() => {
    setSelectedDay(undefined);
    setAttendance({});
  }, [selectedCycleId]);

  const handleAttendanceChange = (athleteId: string, isPresent: boolean) => {
    setAttendance(prev => ({
        ...prev,
        [athleteId]: isPresent
    }));
  };

  const handleSaveAttendance = () => {
    if(!selectedCycleId || !selectedDay || !firestore || !profile?.clubId || !profile.id || !selectedCycle) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona una sesión válida."
        });
        return;
    }
    
    // An event ID is needed to link attendance to a specific session in time
    const eventId = `${selectedCycleId}_${selectedDay}`;
    const attendanceCollection = collection(firestore, `clubs/${profile.clubId}/attendance`);
    
    // Check if attendance for this event already exists
    const q = query(attendanceCollection, where("eventId", "==", eventId));
    
    getDocs(q).then(querySnapshot => {
        const attendanceData = {
            eventId: eventId,
            date: format(new Date(), 'yyyy-MM-dd'), // The actual date of attendance
            coachId: profile.id,
            team: selectedCycle.team,
            attendance: attendance,
            cycleId: selectedCycleId,
            sessionDay: selectedDay,
        };

        if (querySnapshot.empty) {
            // No existing record, create a new one
            addDocumentNonBlocking(attendanceCollection, { ...attendanceData, createdAt: serverTimestamp() });
             toast({ title: "¡Asistencia Guardada!", description: `Se ha registrado la asistencia para la sesión.` });
        } else {
            // Existing record found, update it
            const docRef = querySnapshot.docs[0].ref;
            setDocumentNonBlocking(docRef, { ...attendanceData, updatedAt: serverTimestamp() }, { merge: true });
             toast({ title: "¡Asistencia Actualizada!", description: `Se ha actualizado el registro de asistencia.` });
        }
    }).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: `clubs/${profile.clubId}/attendance`,
        })
        errorEmitter.emit('permission-error', contextualError);
    })
  }

  if (isUserLoading || cyclesLoading) {
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
            Selecciona una semana y una sesión de entrenamiento para marcar la asistencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainingCycles && trainingCycles.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className='flex flex-col sm:flex-row gap-4 w-full'>
                    <Select onValueChange={setSelectedCycleId} value={selectedCycleId}>
                        <SelectTrigger className="w-full sm:w-[380px]">
                            <SelectValue placeholder="Selecciona una semana (Microciclo)" />
                        </SelectTrigger>
                        <SelectContent>
                            {trainingCycles.map((cycle) => (
                            <SelectItem key={cycle.id} value={cycle.id}>
                                {cycle.week} - {cycle.team}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select onValueChange={setSelectedDay} value={selectedDay} disabled={!selectedCycle}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Selecciona una sesión" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedCycle?.sessions.map((session: any) => (
                            <SelectItem key={session.day} value={session.day}>
                                {session.day} - {session.focus}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <Button onClick={handleSaveAttendance} className="w-full sm:w-auto" disabled={!selectedDay || athletesLoading}>
                    {athletesLoading ? <Loader2 className="animate-spin" /> : "Guardar Asistencia"}
                </Button>
              </div>

              {selectedDay && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Deportistas del Equipo: {selectedCycle?.team}
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
                                                aria-label={`Marcar asistencia para ${athlete.firstName} ${athlete.lastName}`}
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
              No tienes planes de entrenamiento (microciclos) asignados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
