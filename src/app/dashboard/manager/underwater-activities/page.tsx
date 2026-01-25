'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, doc, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Waves, PlusCircle, Loader2, MoreVertical, Pencil, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const activitySchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  time: z.string().min(1, "La hora es requerida."),
  location: z.string().min(3, "La ubicación es requerida."),
  activity: z.string().min(5, "La descripción de la actividad es requerida."),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerUnderwaterActivitiesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const { profile, isUserLoading, firestore } = useUser();
  
  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: activities, isLoading: activitiesLoading } = useCollection(activitiesQuery);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      date: '',
      time: '',
      location: '',
      activity: '',
    },
  });

  useEffect(() => {
    if (selectedActivity && isDialogOpen) {
      form.reset(selectedActivity);
    } else {
      form.reset({ date: '', time: '', location: '', activity: '' });
    }
  }, [selectedActivity, isDialogOpen, form]);

  const onSubmit = async (data: ActivityFormValues) => {
    if (!firestore || !profile) return;
    
    if (selectedActivity) {
      // Update existing activity
      const activityRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`, selectedActivity.id);
      updateDocumentNonBlocking(activityRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: '¡Actividad Actualizada!', description: 'La actividad ha sido actualizada.' });
    } else {
      // Create new activity
      addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`), {
        ...data,
        clubId: MAIN_CLUB_ID,
        createdBy: profile.id,
        createdAt: serverTimestamp(),
      });
      toast({ title: '¡Actividad Creada!', description: 'La nueva actividad ha sido programada.' });
    }

    setIsDialogOpen(false);
    setSelectedActivity(null);
  };
  
  const handleDeleteActivity = () => {
    if (!firestore || !selectedActivity) return;
    
    const activityRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`, selectedActivity.id);
    deleteDocumentNonBlocking(activityRef);
    
    toast({ title: '¡Actividad Eliminada!', description: 'La actividad ha sido eliminada del sistema.'});
    setIsDeleteDialogOpen(false);
    setSelectedActivity(null);
  }

  const openDialog = (activity: any | null) => {
    setSelectedActivity(activity);
    setIsDialogOpen(true);
  }
  
  const openDeleteDialog = (activity: any) => {
    setSelectedActivity(activity);
    setIsDeleteDialogOpen(true);
  }
  
  const isLoading = isUserLoading || activitiesLoading;

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline flex items-center gap-2"><Waves/> Gestión de Actividades Subacuáticas</CardTitle>
              <CardDescription>Crea y gestiona las sesiones de actividades subacuáticas del club.</CardDescription>
            </div>
            <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2" />Nueva Actividad</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : activities && activities.length > 0 ? (
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {activities.map(activity => (
                      <Card key={activity.id} className="flex flex-col">
                          <CardHeader className="flex-grow">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <CardTitle className="font-headline text-xl">{activity.activity}</CardTitle>
                                      <CardDescription className="flex items-center gap-2 pt-1"><Calendar/> {format(new Date(`${activity.date}T00:00:00`), "d 'de' MMMM, yyyy", { locale: es })}</CardDescription>
                                  </div>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => openDialog(activity)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openDeleteDialog(activity)} className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2"><Clock/> {activity.time}</div>
                                <div className="flex items-center gap-2"><MapPin/> {activity.location}</div>
                            </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
            ): (
              <p className="text-center text-muted-foreground py-8">
                  No hay actividades programadas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setSelectedActivity(null); setIsDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{selectedActivity ? 'Editar Actividad' : 'Crear Nueva Actividad'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Lugar</FormLabel><FormControl><Input placeholder="Ej: Piscina Olímpica" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="activity" render={({ field }) => (<FormItem><FormLabel>Actividad</FormLabel><FormControl><Textarea placeholder="Describe la actividad o el enfoque de la sesión..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <DialogFooter> <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : (selectedActivity ? "Guardar Cambios" : "Crear Actividad")} </Button> </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de eliminar esta actividad?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la actividad.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedActivity(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteActivity} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
