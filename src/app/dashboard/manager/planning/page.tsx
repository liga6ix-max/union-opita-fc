
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { microcycles, coaches, type Microcycle, type MicrocycleMethodology } from '@/lib/data';
import { createTrainingPlan } from '@/ai/flows/create-training-plan-flow';
import { TrainingPlanInputSchema, type TrainingPlanInput, type TrainingPlanOutput } from '@/ai/schemas/training-plan-schema';


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2 } from 'lucide-react';
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

const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación (4-7 años)',
    futbol_medida: 'Fútbol a la Medida (8-11 años)',
    periodizacion_tactica: 'Periodización Táctica (12-20 años)'
};

// Extend the form schema to include the coach
const PlanningFormSchema = TrainingPlanInputSchema.extend({
  coachId: z.string().min(1, "Debes asignar un entrenador."),
});
type PlanningFormValues = z.infer<typeof PlanningFormSchema>;


export default function ManagerPlanningPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [cycleList, setCycleList] = useState<Microcycle[]>(microcycles);

  const form = useForm<PlanningFormValues>({
    resolver: zodResolver(PlanningFormSchema),
    defaultValues: {
      category: 'Sub-17',
      methodology: 'periodizacion_tactica',
      mesocycleObjective: 'Mejorar la transición defensa-ataque y la finalización.',
      weeks: 4,
      coachId: '',
    },
  });

  const onSubmit = async (data: PlanningFormValues) => {
    setIsGenerating(true);
    toast({
        title: 'Generando planificación...',
        description: 'La IA está creando el plan de entrenamiento. Esto puede tardar un momento.',
    });
    try {
        const generatedPlan: TrainingPlanOutput = await createTrainingPlan(data);
        
        const newMicrocycles: Microcycle[] = generatedPlan.microcycles.map((micro, index) => ({
            id: cycleList.length + index + 1,
            week: micro.week,
            coachId: parseInt(data.coachId),
            team: data.category,
            methodology: data.methodology,
            mainObjective: micro.mainObjective,
            sessions: micro.sessions.map(s => ({
                day: s.day,
                focus: s.focus,
                duration: s.duration,
                activities: s.activities,
            }))
        }));

        setCycleList(prev => [...newMicrocycles, ...prev]);

        toast({
            title: '¡Planificación Generada!',
            description: `Se ha creado un mesociclo de ${data.weeks} semanas para la categoría ${data.category}.`,
        });

    } catch (error) {
        console.error("Error generating training plan:", error);
        toast({
            variant: 'destructive',
            title: 'Error al generar el plan',
            description: 'Hubo un problema con la IA. Por favor, inténtalo de nuevo.',
        });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Asistente de Planificación (IA)</CardTitle>
          <CardDescription>
            Genera y asigna un plan de entrenamiento completo (mesociclo) para una categoría y un entrenador específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <FormField control={form.control} name="category" render={({ field }) => (
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
                         <FormField control={form.control} name="weeks" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duración (Semanas)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="coachId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Asignar a Entrenador</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {coaches.map(coach => (
                                    <SelectItem key={coach.id} value={coach.id.toString()}>{coach.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>

                    <FormField control={form.control} name="mesocycleObjective" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Objetivo Principal del Mesociclo</FormLabel>
                            <FormControl><Textarea placeholder="Describe el objetivo principal para este plan (ej: mejorar la salida de balón, aumentar la resistencia aeróbica...)" {...field} /></FormControl>
                            <FormDescription>La IA usará este objetivo para estructurar los microciclos de forma progresiva.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                        {isGenerating ? 'Generando Plan...' : 'Generar y Asignar Plan'}
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Microciclos Planificados</CardTitle>
          <CardDescription>
            Estos son los planes de entrenamiento semanales generados y asignados a los entrenadores.
          </CardDescription>
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
