
'use client';

import { useState } from 'react';
import { athletes, microcycles, coaches } from '@/lib/data';
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

// Asumimos que el entrenador con ID 1 ha iniciado sesión
const currentCoachId = 1;
const coach = coaches.find(c => c.id === currentCoachId);
const coachAthletes = athletes.filter(a => a.coachId === currentCoachId);
const coachCycle = microcycles.find(c => c.coachId === currentCoachId);

type AttendanceRecord = Record<string, Record<number, boolean>>;

export default function CoachAttendancePage() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<string | undefined>(
    coachCycle?.sessions[0]?.day
  );
  // Estado para simular el guardado de la asistencia
  const [attendance, setAttendance] = useState<AttendanceRecord>({});

  const handleAttendanceChange = (athleteId: number, isPresent: boolean) => {
    if (!selectedSession) return;
    setAttendance(prev => ({
        ...prev,
        [selectedSession]: {
            ...prev[selectedSession],
            [athleteId]: isPresent
        }
    }));
  };

  const handleSaveAttendance = () => {
    if(!selectedSession) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona una sesión."
        });
        return;
    }
    // En una app real, esto guardaría los datos en la base de datos.
    console.log(`Asistencia guardada para la sesión de ${selectedSession}:`, attendance[selectedSession]);
    toast({
        title: "¡Asistencia Guardada!",
        description: `Se ha registrado la asistencia para la sesión de ${selectedSession}.`
    });
  }

  const currentSessionAthletes = coachAthletes.filter(athlete => 
    coachCycle?.team === athlete.team
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserCheck /> Registro de Asistencia
          </CardTitle>
          <CardDescription>
            Selecciona una sesión y marca la asistencia de los deportistas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coachCycle ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Select onValueChange={setSelectedSession} value={selectedSession}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Selecciona una sesión de entrenamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {coachCycle.sessions.map((session, index) => (
                      <SelectItem key={index} value={session.day}>
                        {session.day} - {session.focus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSaveAttendance} className="w-full sm:w-auto" disabled={!selectedSession}>
                    Guardar Asistencia
                </Button>
              </div>

              {selectedSession && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Deportistas del Equipo: {coachCycle.team}
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
                                                checked={attendance[selectedSession]?.[athlete.id] || false}
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
              No tienes un microciclo de entrenamiento asignado para esta semana.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
