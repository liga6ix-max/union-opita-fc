
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, MapPin, Clock } from 'lucide-react';

const schedule = [
    { day: 'Lunes', time: '6:00 AM - 7:00 AM', location: 'Gimnasio Principal', activity: 'Entrenamiento Funcional General' },
    { day: 'Miércoles', time: '6:00 AM - 7:00 AM', location: 'Gimnasio Principal', activity: 'Entrenamiento de Alta Intensidad (HIIT)' },
    { day: 'Viernes', time: '6:00 AM - 7:00 AM', location: 'Gimnasio Principal', activity: 'Movilidad y Flexibilidad' },
];

export default function UnifitSchedulePage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays /> Horarios y Lugar
          </CardTitle>
          <CardDescription>
            Estos son los horarios fijos para el programa de entrenamiento funcional UNIFIT.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {session.day}</TableCell>
                    <TableCell className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {session.time}</TableCell>
                    <TableCell className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {session.location}</TableCell>
                    <TableCell>{session.activity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
