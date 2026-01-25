
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTrainingPlan } from '@/ai/flows/create-training-plan-flow';
import { TrainingPlanInputSchema } from '@/ai/schemas/training-plan-schema';
import clubConfig from '@/lib/club-config.json';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Trash2, Maximize, GlassWater, Copy } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const CloneFormSchema = z.object({
    team: z.string().min(1, "Debes seleccionar un equipo."),
    coachId: z.string().min(1, "Debes seleccionar un entrenador."),
});
type CloneFormValues = z.infer<typeof CloneFormSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerPlanningPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [planToClone, setPlanToClone] = useState<any | null>(null);
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/trainingPlans`);
  }, [firestore]);
  const { data: planList, isLoading: plansLoading } = useCollection(plansQuery);
  
  const coachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
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
      level: 1,
      coachId: '',
    },
  });

  const cloneForm = useForm<CloneFormValues>({
    resolver: zodResolver(CloneFormSchema),
    defaultValues: { team: '', coachId: '' },
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
        
        const trainingPlansCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/trainingPlans`);
        addDocumentNonBlocking(trainingPlansCollection, {
            ...generatedPlan,
            team: data.category,
            level: data.level,
            coachId: data.coachId,
            methodology: data.methodology,
            clubId: MAIN_CLUB_ID,
            createdAt: serverTimestamp(),
        });

        toast({
            title: '¡Planificación Generada y Guardada!',
            description: `Se ha creado y guardado un mesociclo de ${data.weeks} semanas.`,
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
  
  const confirmDeletePlan = () => {
    if (!planToDelete || !firestore) return;
    const planDocRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/trainingPlans`, planToDelete);
    deleteDocumentNonBlocking(planDocRef);
    toast({
      title: "Plan Eliminado",
      description: "El plan de entrenamiento ha sido eliminado."
    });
    setPlanToDelete(null);
  };

  const handleCloneSubmit = (data: CloneFormValues) => {
    if (!planToClone || !firestore) return;
    
    const { id, ...originalPlanData } = planToClone;
    
    addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/trainingPlans`), {
        ...originalPlanData,
        team: data.team,
        coachId: data.coachId,
        createdAt: serverTimestamp(),
    });

    toast({ title: "Plan Clonado", description: `El plan se ha asignado a ${data.team}.` });
    setPlanToClone(null);
    cloneForm.reset();
  }
  
  if (isUserLoading || plansLoading || coachesLoading) {
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          {watchMethodology !== 'unifit' ? (
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
                          ) : (
                             <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <FormControl><Input {...field} disabled readOnly /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                          )}
                           <FormField control={form.control} name="level" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nivel</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value)}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {Array.from({length: 12}, (_, i) => i + 1).map(level => (
                                                <SelectItem key={level} value={String(level)}>{level}</SelectItem>
                                            ))}
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
            <CardTitle className="font-headline">Planes de Entrenamiento Guardados</CardTitle>
            <CardDescription>Planes de entrenamiento generados y asignados. Puedes clonarlos para otros equipos.</CardDescription>
          </CardHeader>
          <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {planList?.map((plan) => {
                  const coach = coaches?.find((c) => c.id === plan.coachId);
                  return (
                   <Card key={plan.id}>
                      <AccordionItem value={`plan-${plan.id}`} className="border-b-0">
                          <AccordionTrigger className="p-6 hover:no-underline">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4">
                                  <div className='text-left'>
                                      <h4 className="font-bold text-lg">{plan.mesocycleObjective}</h4>
                                      <p className='text-sm text-muted-foreground'>Asignado a: {coach?.firstName || 'N/A'}</p>
                                  </div>
                                  <div className='flex items-center gap-2 mt-2 md:mt-0'>
                                    <Badge variant="outline">Nivel {plan.level}</Badge>
                                    <Badge variant="secondary">{plan.team}</Badge>
                                  </div>
                             </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 pt-0">
                             <div className="space-y-4">
                               {plan.microcycles.map((micro: any, microIndex: number) => (
                                    <div key={microIndex} className='py-2'>
                                        <h5 className="font-semibold text-base">{micro.week}: <span className='text-muted-foreground font-normal'>{micro.mainObjective}</span></h5>
                                        <div className="space-y-2 mt-2">
                                            {micro.sessions.map((session:any, sessionIndex:number) => (
                                                <div key={sessionIndex} className="border-l-2 border-primary pl-4 py-2">
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
                                    </div>
                               ))}
                               <div className="pt-4 mt-4 border-t flex flex-wrap gap-2">
                                  <Button variant="destructive" onClick={() => setPlanToDelete(plan.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Plan
                                  </Button>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setPlanToClone(plan)}>
                                        <Copy className="mr-2 h-4 w-4" /> Clonar y Asignar
                                    </Button>
                                  </DialogTrigger>
                               </div>
                             </div>
                          </AccordionContent>
                      </AccordionItem>
                   </Card>
                  );
                })}
              </Accordion>
               {(!planList || planList.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No hay planificaciones generadas.</p>
              )}
          </CardContent>
        </Card>
      </div>

    {/* Clone Dialog */}
    <Dialog open={!!planToClone} onOpenChange={(isOpen) => !isOpen && setPlanToClone(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Clonar Plan de Entrenamiento</DialogTitle>
            </DialogHeader>
            <Form {...cloneForm}>
                <form onSubmit={cloneForm.handleSubmit(handleCloneSubmit)} className='space-y-4 py-4'>
                    <p className='text-sm text-muted-foreground'>
                        Reutiliza el plan <span className='font-semibold text-foreground'>{planToClone?.mesocycleObjective}</span> (Nivel {planToClone?.level}) para un nuevo equipo.
                    </p>
                    <FormField control={cloneForm.control} name="team" render={({ field }) => (
                       <FormItem>
                           <FormLabel>Asignar a Nuevo Equipo</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                               <SelectContent>
                               <SelectItem value="UNIFIT">UNIFIT</SelectItem>
                               {clubConfig.categories.map(cat => (
                                   <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                               ))}
                               </SelectContent>
                           </Select>
                           <FormMessage />
                       </FormItem>
                   )}/>
                   <FormField control={cloneForm.control} name="coachId" render={({ field }) => (
                       <FormItem>
                           <FormLabel>Asignar a Nuevo Entrenador</FormLabel>
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
                   <DialogFooter>
                       <Button type="submit" disabled={cloneForm.formState.isSubmitting}>
                           {cloneForm.formState.isSubmitting ? <Loader2 className='animate-spin' /> : 'Clonar Plan'}
                       </Button>
                   </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

      <AlertDialog open={!!planToDelete} onOpenChange={(isOpen) => !isOpen && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan de entrenamiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
