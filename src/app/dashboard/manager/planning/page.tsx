
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTrainingPlan } from '@/ai/flows/create-training-plan-flow';
import { TrainingPlanInputSchema, type TrainingPlanOutput } from '@/ai/schemas/training-plan-schema';
import clubConfig from '@/lib/club-config.json';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Trash2, Maximize, GlassWater } from 'lucide-react';
import {
  Form,
  FormControl,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica' | 'unifit';

const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación',
    futbol_medida: 'Fútbol a la Medida',
    periodizacion_tactica: 'Periodización Táctica',
    unifit: 'UNIFIT',
};

const PlanningFormSchema = TrainingPlanInputSchema.extend({
  coachId: z.string().min(1, "Debes asignar un entrenador."),
});
type PlanningFormValues = z.infer<typeof PlanningFormSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerPlanningPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

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
      category: 'UNIFIT',
      methodology: 'unifit',
      mesocycleObjective: 'Mejorar la fuerza explosiva y la resistencia cardiovascular.',
      weeks: 4,
      coachId: '',
    },
  });

  const watchMethodology = form.watch('methodology');

  const onSubmit = (data: PlanningFormValues) => {
    setIsGenerating(true);
    toast({ title: 'Generando planificación...', description: 'La IA está creando el plan de entrenamiento. Esto puede tardar un momento.' });
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.'});
        setIsGenerating(false);
        return;
    }

    createTrainingPlan(data)
      .then((generatedPlan) => {
        if (!generatedPlan || !generatedPlan.microcycles) {
            throw new Error("La respuesta de la IA no tiene el formato esperado.");
        }
        const microcyclesCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`);
        generatedPlan.microcycles.forEach(micro => {
            addDocumentNonBlocking(microcyclesCollection, {
                week: micro.week,
                coachId: data.coachId,
                team: data.category,
                methodology: data.methodology,
                mainObjective: micro.mainObjective,
                sessions: micro.sessions,
                clubId: MAIN_CLUB_ID,
            });
        });

        toast({
            title: '¡Planificación Generada y Guardada!',
            description: `Se ha creado y guardado un mesociclo de ${data.weeks} semanas para la categoría ${data.category}.`,
        });
      })
      .catch((error) => {
        console.error("Error generating training plan:", error);
        toast({
            variant: 'destructive',
            title: 'Error al generar el plan',
            description: 'Hubo un problema con la IA. Por favor, revisa la configuración y vuelve a intentarlo.',
        });
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };
  
  const confirmDeleteCycle = () => {
    if (!cycleToDelete || !firestore) return;

    const cycleDocRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`, cycleToDelete);

    deleteDocumentNonBlocking(cycleDocRef);
    toast({
      title: "Plan Semanal Eliminado",
      description: "El microciclo ha sido eliminado correctamente."
    });
    setCycleToDelete(null); // Close the dialog
  };
  
  if (isUserLoading || cyclesLoading || coachesLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
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
                           <FormField control={form.control} name="methodology" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Metodología</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una metodología" /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="unifit">{methodologyLabels.unifit}</SelectItem>
                                          <SelectItem value="tecnificacion">{methodologyLabels.tecnificacion}</SelectItem>
                                          <SelectItem value="futbol_medida">{methodologyLabels.futbol_medida}</SelectItem>
                                          <SelectItem value="periodizacion_tactica">{methodologyLabels.periodizacion_tactica}</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}/>
                          {watchMethodology !== 'unifit' && (
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
                          )}
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
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                              {session.fieldDimensions && (
                                                  <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4"/> {session.fieldDimensions}</span>
                                              )}
                                              {session.recoveryTime && (
                                                  <span className="flex items-center gap-1.5"><GlassWater className="h-4 w-4"/> {session.recoveryTime}</span>
                                              )}
                                          </div>
                                          <p className="text-muted-foreground whitespace-pre-wrap mt-2">{session.activities}</p>
                                      </div>
                                  ))}
                              </div>
                               <div className="pt-4 mt-4 border-t">
                                  <Button variant="destructive" onClick={() => setCycleToDelete(cycle.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Plan Semanal
                                  </Button>
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
      <AlertDialog open={!!cycleToDelete} onOpenChange={(isOpen) => !isOpen && setCycleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan de entrenamiento de esta semana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCycleToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCycle} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

