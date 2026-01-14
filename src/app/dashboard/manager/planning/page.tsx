'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTrainingPlan } from '@/ai/flows/create-training-plan-flow';
import { TrainingPlanInputSchema, type TrainingPlanOutput } from '@/ai/schemas/training-plan-schema';
import clubConfig from '@/lib/club-config.json';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc } from 'firebase/firestore';


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

type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica';

const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación (4-7 años)',
    futbol_medida: 'Fútbol a la Medida (8-11 años)',
    periodizacion_tactica: 'Periodización Táctica (12-20 años)'
};

const PlanningFormSchema = TrainingPlanInputSchema.extend({
  coachId: z.string().min(1, "Debes asignar un entrenador."),
});
type PlanningFormValues = z.infer<typeof PlanningFormSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerPlanningPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const { profile, isUserLoading, firestore } = useUser();

  const cyclesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`);
  }, [firestore]);
  const { data: cycleList, isLoading: cyclesLoading } = useCollection(cyclesQuery);
  
  const coachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for all users that are staff (coaches or managers).
    return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "in", ["coach", "manager"]));
  }, [firestore]);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

  const form = useForm<PlanningFormValues>({
    resolver: zodResolver(PlanningFormSchema),
    defaultValues: {
      category: clubConfig.categories[0]?.name || 'Juvenil',
      methodology: 'periodizacion_tactica',
      mesocycleObjective: 'Mejorar la transición defensa-ataque y la finalización.',
      weeks: 4,
      coachId: '',
    },
  });

  const onSubmit = async (data: PlanningFormValues) => {
    setIsGenerating(true);
    toast({ title: 'Generando planificación...', description: 'La IA está creando el plan de entrenamiento. Esto puede tardar un momento.' });
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.'});
        setIsGenerating(false);
        return;
    }

    try {
        const generatedPlan: TrainingPlanOutput = await createTrainingPlan(data);
        
        const microcyclesCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`);
        for (const micro of generatedPlan.microcycles) {
            await addDoc(microcyclesCollection, {
                week: micro.week,
                coachId: data.coachId,
                team: data.category,
                methodology: data.methodology,
                mainObjective: micro.mainObjective,
                sessions: micro.sessions,
                clubId: MAIN_CLUB_ID,
            });
        }

        toast({
            title: '¡Planificación Generada y Guardada!',
            description: `Se ha creado y guardado un mesociclo de ${data.weeks} semanas para la categoría ${data.category}.`,
        });

    } catch (error) {
        console.error("Error generating or saving training plan:", error);
        toast({
            variant: 'destructive',
            title: 'Error al generar el plan',
            description: 'Hubo un problema con la IA o al guardar en la base de datos. Por favor, inténtalo de nuevo.',
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  if (isUserLoading || cyclesLoading || coachesLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    {clubConfig.categories.map(cat => (
                                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
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
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar entrenador..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {coaches && coaches.length > 0 ? coaches.map(coach => (
                                    <SelectItem key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</SelectItem>
                                  )) : <SelectItem value="none" disabled>No hay entrenadores</SelectItem>}
                                </SelectContent>
                              </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>

                    <FormField control={form.control} name="mesocycleObjective" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Objetivo Principal del Mesociclo</FormLabel>
                            <FormControl><Textarea placeholder="Describe el objetivo principal para este plan..." {...field} /></FormControl>
                            <FormDescription>La IA usará este objetivo para estructurar los microciclos.</FormDescription>
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
          <CardDescription>Planes de entrenamiento semanales generados y asignados.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {cycleList?.map((cycle) => {
                const coach = coaches?.find((c) => c.id === cycle.coachId);
                return (
                 <Card key={cycle.id}>
                    <AccordionItem value={`cycle-${cycle.id}`} className="border-b-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4">
                                <div className='text-left'>
                                    <h4 className="font-bold text-lg">{cycle.week} - {cycle.team}</h4>
                                    <p className='text-sm text-muted-foreground'>Asignado a: {coach?.firstName || 'N/A'}</p>
                                </div>
                                <Badge variant="secondary" className="mt-2 md:mt-0">{methodologyLabels[cycle.methodology as MicrocycleMethodology]}</Badge>
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
                                {cycle.sessions.map((session:any, index:number) => (
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
             {(!cycleList || cycleList.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">No hay planificaciones generadas.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
