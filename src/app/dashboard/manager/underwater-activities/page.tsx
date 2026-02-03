
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, doc, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Waves, PlusCircle, Loader2, MoreVertical, Pencil, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const MAIN_CLUB_ID = 'OpitaClub';

const activitySchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  time: z.string().min(1, "La hora es requerida."),
  location: z.string().min(3, "La ubicación es requerida."),
  activity: z.string().min(5, "La descripción es requerida."),
  level: z.coerce.number().min(1).max(12).optional().or(z.literal('')),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export default function ManagerUnderwaterActivitiesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const { user, profile, firestore, isUserLoading } = useUser();
  
  // CRITICAL GUARD: Only fetch if authenticated to prevent sign-out error
  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'manager') return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`), orderBy('date', 'desc'));
  }, [firestore, user, profile?.role]);
  const { data: activities, isLoading: activitiesLoading } = useCollection(activitiesQuery);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { date: '', time: '', location: '', activity: '', level: '' },
  });

  useEffect(() => {
    if (selectedActivity && isDialogOpen) {
      form.reset({ ...selectedActivity, level: selectedActivity.level || '' });
    }
  }, [selectedActivity, isDialogOpen, form]);

  const onSubmit = (data: ActivityFormValues) => {
    if (!firestore || !user) return;
    const payload = { ...data, level: data.level || null };

    if (selectedActivity) {
      updateDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`, selectedActivity.id), { ...payload, updatedAt: serverTimestamp() });
      toast({ title: 'Actividad Actualizada' });
    } else {
      addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`), { ...payload, clubId: MAIN_CLUB_ID, createdBy: user.uid, createdAt: serverTimestamp() });
      toast({ title: 'Actividad Creada' });
    }
    setIsDialogOpen(false);
    setSelectedActivity(null);
  };
  
  const handleDelete = () => {
    if (!selectedActivity || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`, selectedActivity.id));
    toast({ title: 'Actividad Eliminada' });
    setIsDeleteDialogOpen(false);
  }

  if (isUserLoading || activitiesLoading) {
    return <div className="flex h-full w-full items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><Waves/> Gestión Actividades Subacuáticas</CardTitle>
            <CardDescription>Programa sesiones de piscina para los deportistas.</CardDescription>
          </div>
          <Button onClick={() => { setSelectedActivity(null); form.reset(); setIsDialogOpen(true); }}><PlusCircle className="mr-2" />Nueva</Button>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {activities?.map(act => (
                  <Card key={act.id}>
                      <CardHeader className="flex flex-row items-start justify-between">
                          <div>
                              <CardTitle className="text-lg">{act.activity}</CardTitle>
                              <CardDescription>{format(new Date(`${act.date}T00:00:00`), "d 'de' MMMM", { locale: es })}</CardDescription>
                          </div>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedActivity(act); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedActivity(act); setIsDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4"/> {act.time}</div>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {act.location}</div>
                          {act.level && <Badge className="mt-2" variant="secondary">Nivel {act.level}</Badge>}
                      </CardContent>
                  </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedActivity ? 'Editar' : 'Nueva'} Actividad</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)}/>
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Lugar</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="level" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nivel (1-12)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                            <SelectContent>{Array.from({length: 12}, (_, i) => (
                                <SelectItem key={i+1} value={String(i+1)}>Nivel {i+1}</SelectItem>
                            ))}</SelectContent>
                        </Select>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="activity" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)}/>
                <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
