
'use client';

import { useState } from 'react';
import { athletes, trainingEvents, coaches } from '@/lib/data';
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
import { UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Asumimos que el entrenador con ID 1 ha iniciado sesión
const currentCoachId = 1;
const coach = coaches.find(c => c.id === currentCoachId);
// Filtramos los eventos de entrenamiento para el coach actual
const coachEvents = trainingEvents.filter(e => e.coachId === currentCoachId);

type AttendanceRecord = Record<string, Record<number, boolean>>;

export default function CoachAttendancePage() {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    coachEvents[0]?.id.toString()
  );
  const [attendance, setAttendance] = useState<AttendanceRecord>({});

  const handleAttendanceChange = (athleteId: number, isPresent: boolean) => {
    if (!selectedEventId) return;
    setAttendance(prev => ({
        ...prev,
        [selectedEventId]: {
            ...prev[selectedEventId],
            [athleteId]: isPresent
        }
    }));
  };

  const handleSaveAttendance = () => {
    if(!selectedEventId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona una sesión."
        });
        return;
    }
    const event = coachEvents.find(e => e.id.toString() === selectedEventId);
    console.log(`Asistencia guardada para el evento ${event?.title}:`, attendance[selectedEventId]);
    toast({
        title: "¡Asistencia Guardada!",
        description: `Se ha registrado la asistencia para la sesión seleccionada.`
    });
  }

  const selectedEvent = coachEvents.find(e => e.id.toString() === selectedEventId);
  const currentSessionAthletes = selectedEvent 
    ? athletes.filter(athlete => athlete.team === selectedEvent.team)
    : [];

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
          {coachEvents.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Select onValueChange={setSelectedEventId} value={selectedEventId}>
                  <SelectTrigger className="w-full sm:w-[380px]">
                    <SelectValue placeholder="Selecciona una sesión de entrenamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {coachEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {format(new Date(event.date), "PPP", { locale: es })} a las {event.time} - {event.team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSaveAttendance} className="w-full sm:w-auto" disabled={!selectedEventId}>
                    Guardar Asistencia
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
                            {currentSessionAthletes.length > 0 ? (
                                currentSessionAthletes.map(athlete => (
                                    <TableRow key={athlete.id}>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                id={`athlete-${athlete.id}`}
                                                checked={attendance[selectedEventId]?.[athlete.id] || false}
                                                onCheckedChange={(checked) => handleAttendanceChange(athlete.id, !!checked)}
                                                aria-label={`Marcar asistencia para ${athlete.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <label htmlFor={`athlete-${athlete.id}`} className="cursor-pointer">
                                                {athlete.name}
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
            <p className="text-muted-foreground text-center">
              No tienes sesiones de entrenamiento programadas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
