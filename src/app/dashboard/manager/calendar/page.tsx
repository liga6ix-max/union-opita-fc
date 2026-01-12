
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { trainingEvents, coaches, type TrainingEvent } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, Clock, Users, User, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const eventSchema = z.object({
  title: z.string().min(3, 'El título es requerido.'),
  date: z.string().min(1, 'La fecha es requerida.'),
  time: z.string().min(1, 'La hora es requerida.'),
  team: z.string().min(1, 'El equipo es requerido.'),
  coachId: z.string().min(1, 'El entrenador es requerido.'),
  location: z.string().min(3, 'La ubicación es requerida.'),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function ManagerCalendarPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<TrainingEvent[]>(trainingEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '',
      team: '',
      coachId: '',
      location: 'Cancha Principal',
    },
  });

  const onSubmit = (data: EventFormValues) => {
    const newEvent: TrainingEvent = {
      id: events.length + 1,
      ...data,
      coachId: parseInt(data.coachId, 10),
    };
    setEvents((prev) => [...prev, newEvent].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({
      title: '¡Evento Creado!',
      description: `El entrenamiento "${data.title}" ha sido programado.`,
    });
    setIsDialogOpen(false);
    form.reset();
  };
  
  const getCoachName = (coachId: number) => {
    return coaches.find(c => c.id === coachId)?.name || 'N/A';
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Calendario de Entrenamientos</CardTitle>
            <CardDescription>
              Programa y gestiona las sesiones de entrenamiento para todos los equipos.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Programar Sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Programar Nueva Sesión</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título de la Sesión</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Entrenamiento de definición" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipo</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Sub-17">Sub-17</SelectItem>
                                <SelectItem value="Sub-20">Sub-20</SelectItem>
                                <SelectItem value="Tecnificación">Tecnificación</SelectItem>
                                <SelectItem value="Fútbol Medida">Fútbol Medida</SelectItem>
                            </SelectContent>
                           </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="coachId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entrenador</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Asignar" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {coaches.map(coach => (
                                <SelectItem key={coach.id} value={coach.id.toString()}>{coach.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lugar</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Guardar Sesión</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
            {events.length > 0 ? (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted text-muted-foreground w-20 text-center">
                                <span className="text-xs font-bold uppercase">{format(parseISO(event.date), 'MMM', { locale: es })}</span>
                                <span className="text-2xl font-bold">{format(parseISO(event.date), 'dd')}</span>
                                <span className="text-xs">{event.time}</span>
                            </div>
                            <div className='flex-1'>
                                <h4 className="font-semibold text-md">{event.title}</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-2"><Users className="h-4 w-4" />{event.team}</span>
                                    <span className="flex items-center gap-2"><User className="h-4 w-4" />{getCoachName(event.coachId)}</span>
                                    <span className="flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4" />{event.location}</span>
                                </div>
                            </div>
                            <div>
                                {/* Actions like Edit/Delete could go here */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">
                    No hay sesiones de entrenamiento programadas.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
