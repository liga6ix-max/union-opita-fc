'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

const taskSchema = z.object({
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  assigneeId: z.string().min(1, 'Debes asignar la tarea a un entrenador.'),
  dueDate: z.string().min(1, 'La fecha límite es requerida.'),
});

type TaskFormValues = z.infer<typeof taskSchema>;
type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';

const statusBadgeVariant: Record<TaskStatus, 'default' | 'secondary' | 'destructive'> = {
  'Completada': 'default',
  'En Progreso': 'secondary',
  'Pendiente': 'destructive',
};

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerTasksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/tasks`);
  }, [firestore]);
  const { data: taskList, isLoading: tasksLoading } = useCollection(tasksQuery);

  const coachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
  }, [firestore]);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { description: '', assigneeId: '', dueDate: '' },
  });

  const onSubmit = async (data: TaskFormValues) => {
    if (!firestore || !profile?.id) return;

    try {
      await addDoc(collection(firestore, `clubs/${MAIN_CLUB_ID}/tasks`), {
        ...data,
        status: 'Pendiente',
        assignerId: profile.id,
        clubId: MAIN_CLUB_ID,
        createdAt: serverTimestamp(),
      });
      toast({ title: '¡Tarea Creada!', description: `La tarea ha sido asignada.` });
      setIsDialogOpen(false);
      form.reset();
    } catch(e) {
      console.error("Error creating task:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la tarea.' });
    }
  };
  
  if (isUserLoading || tasksLoading || coachesLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Gestión de Tareas</CardTitle>
            <CardDescription>Asigna y supervisa las tareas de los entrenadores.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Nueva Tarea</Button></DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader><DialogTitle>Crear Nueva Tarea</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea placeholder="Describe la tarea en detalle..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="assigneeId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asignar a</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un entrenador" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {coaches?.map((coach) => (
                                <SelectItem key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha Límite</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Tarea</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción de la Tarea</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList?.map((task) => {
                const coach = coaches?.find((c) => c.id === task.assigneeId);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.description}</TableCell>
                    <TableCell>{coach?.firstName || 'N/A'}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[task.status as TaskStatus]}>
                        {task.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {(!taskList || taskList.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">No hay tareas creadas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
