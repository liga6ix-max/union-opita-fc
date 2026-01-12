
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { microcycles, coaches, type Microcycle } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


const sessionSchema = z.object({
  day: z.string().min(1, "El día es requerido."),
  focus: z.string().min(1, "El foco es requerido."),
  duration: z.coerce.number().min(1, "La duración debe ser mayor a 0."),
  activities: z.string().min(10, "Las actividades son requeridas."),
});

const microcycleSchema = z.object({
  week: z.string().min(1, 'La semana es requerida.'),
  coachId: z.string().min(1, 'Debes asignar un entrenador.'),
  team: z.string().min(1, 'El equipo es requerido.'),
  methodology: z.enum(['tecnificacion', 'futbol_medida', 'periodizacion_tactica'], {
    required_error: 'La metodología es requerida.',
  }),
  mainObjective: z.string().min(10, 'El objetivo principal es requerido.'),
  sessions: z.array(sessionSchema).min(1, 'Debe haber al menos una sesión.'),
});

type MicrocycleFormValues = z.infer<typeof microcycleSchema>;

const methodologyLabels = {
    tecnificacion: 'Tecnificación (4-7 años)',
    futbol_medida: 'Fútbol a la Medida (8-11 años)',
    periodizacion_tactica: 'Periodización Táctica (12-20 años)'
};

export default function ManagerPlanningPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cycleList, setCycleList] = useState<Microcycle[]>(microcycles);

  const form = useForm<MicrocycleFormValues>({
    resolver: zodResolver(microcycleSchema),
    defaultValues: {
      week: '',
      coachId: '',
      team: '',
      mainObjective: '',
      sessions: [{ day: 'Lunes', focus: '', duration: 90, activities: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sessions"
  });

  const onSubmit = (data: MicrocycleFormValues) => {
    const coach = coaches.find(c => c.id === parseInt(data.coachId, 10));
    const newCycle: Microcycle = {
      id: cycleList.length + 1,
      ...data,
      coachId: parseInt(data.coachId, 10),
      methodology: data.methodology,
    };
    setCycleList((prev) => [newCycle, ...prev]);
    toast({
      title: '¡Microciclo Creado!',
      description: `El ciclo para la ${data.week} ha sido asignado a ${coach?.name}.`,
    });
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Planificación de Microciclos</CardTitle>
            <CardDescription>
              Crea y asigna planes de entrenamiento semanales a los entrenadores.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Nuevo Microciclo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Microciclo</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Fila 1: Datos Generales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="week" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Semana</FormLabel>
                                <FormControl><Input placeholder="Ej: Semana 34 (19 Ago - 25 Ago)" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="coachId" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Asignar a</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un entrenador" /></SelectTrigger></FormControl>
                                <SelectContent>{coaches.map((coach) => (<SelectItem key={coach.id} value={coach.id.toString()}>{coach.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="team" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría / Equipo</FormLabel>
                                <FormControl><Input placeholder="Ej: Sub-17" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="methodology" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Metodología</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una metodología" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="tecnificacion">{methodologyLabels.tecnificacion}</SelectItem>
                                        <SelectItem value="futbol_medida">{methodologyLabels.futbol_medida}</SelectItem>
                                        <SelectItem value="periodizacion_tactica">{methodologyLabels.periodizacion_tactica}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>

                    {/* Fila 2: Objetivo Principal */}
                    <FormField control={form.control} name="mainObjective" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Objetivo Principal del Microciclo</FormLabel>
                            <FormControl><Textarea placeholder="Describe el objetivo principal para esta semana de entrenamiento..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    {/* Fila 3: Sesiones */}
                    <div className='space-y-4'>
                        <FormLabel>Sesiones de Entrenamiento</FormLabel>
                        {fields.map((field, index) => (
                           <Card key={field.id} className="p-4 bg-muted/50 relative">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                               <FormField control={form.control} name={`sessions.${index}.day`} render={({ field }) => (
                                   <FormItem>
                                       <FormLabel>Día</FormLabel>
                                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Elige un día" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Lunes">Lunes</SelectItem>
                                                <SelectItem value="Martes">Martes</SelectItem>
                                                <SelectItem value="Miércoles">Miércoles</SelectItem>
                                                <SelectItem value="Jueves">Jueves</SelectItem>
                                                <SelectItem value="Viernes">Viernes</SelectItem>
                                                <SelectItem value="Sábado">Sábado</SelectItem>
                                            </SelectContent>
                                       </Select>
                                       <FormMessage />
                                   </FormItem>
                               )}/>
                               <FormField control={form.control} name={`sessions.${index}.focus`} render={({ field }) => (
                                   <FormItem>
                                       <FormLabel>Foco de la sesión</FormLabel>
                                       <FormControl><Input placeholder="Técnico, Táctico, Físico..." {...field} /></FormControl>
                                       <FormMessage />
                                   </FormItem>
                               )}/>
                               <FormField control={form.control} name={`sessions.${index}.duration`} render={({ field }) => (
                                   <FormItem>
                                       <FormLabel>Duración (min)</FormLabel>
                                       <FormControl><Input type="number" placeholder="90" {...field} /></FormControl>
                                       <FormMessage />
                                   </FormItem>
                               )}/>
                                <FormField control={form.control} name={`sessions.${index}.activities`} render={({ field }) => (
                                   <FormItem className="md:col-span-4">
                                       <FormLabel>Actividades y Ejercicios</FormLabel>
                                       <FormControl><Textarea placeholder="Describe las actividades..." {...field} /></FormControl>
                                       <FormMessage />
                                   </FormItem>
                               )}/>
                            </div>
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                           </Card>
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ day: 'Miércoles', focus: '', duration: 90, activities: '' })}
                        >
                           <PlusCircle className="mr-2"/> Añadir Sesión
                        </Button>
                    </div>

                  <DialogFooter>
                    <Button type="submit">Crear Microciclo</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {cycleList.map((cycle) => {
                const coach = coaches.find((c) => c.id === cycle.coachId);
                return (
                 <Card key={cycle.id}>
                    <AccordionItem value={`cycle-${cycle.id}`} className="border-b-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4">
                                <div className='text-left'>
                                    <h4 className="font-bold text-lg">{cycle.week} - {cycle.team}</h4>
                                    <p className='text-sm text-muted-foreground'>Asignado a: {coach?.name || 'N/A'}</p>
                                </div>
                                <Badge variant="secondary" className="mt-2 md:mt-0">{methodologyLabels[cycle.methodology]}</Badge>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                           <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold">Objetivo Principal</h5>
                                <p className="text-muted-foreground">{cycle.mainObjective}</p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-semibold">Sesiones</h5>
                                {cycle.sessions.map((session, index) => (
                                    <div key={index} className="border-l-2 border-primary pl-4 py-2">
                                        <p className="font-bold">{session.day} - {session.focus} ({session.duration} min)</p>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{session.activities}</p>
                                    </div>
                                ))}
                            </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Card>
                );
              })}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
