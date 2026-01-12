
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';

type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';

const statusBadgeVariant: Record<TaskStatus, "default" | "secondary" | "destructive"> = {
    'Completada': 'default',
    'En Progreso': 'secondary',
    'Pendiente': 'destructive'
};

export default function CoachTasksPage() {
  const { toast } = useToast();
  const { profile, firestore, isUserLoading } = useUser();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId || !profile.id) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/tasks`), where("assigneeId", "==", profile.id));
  }, [firestore, profile?.clubId, profile?.id]);

  const { data: taskList, isLoading: tasksLoading } = useCollection(tasksQuery);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!firestore || !profile?.clubId) return;
    const taskRef = doc(firestore, `clubs/${profile.clubId}/tasks`, taskId);
    try {
        await updateDoc(taskRef, { status: newStatus });
        toast({
            title: '¡Estado de la Tarea Actualizado!',
            description: `La tarea ha sido marcada como "${newStatus}".`,
        });
    } catch(e) {
        console.error("Error updating task status:", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar el estado de la tarea."
        })
    }
  };

  const openDetailsModal = (task: any) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  }
  
  if (isUserLoading || tasksLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Mis Tareas Asignadas</CardTitle>
            <CardDescription>
                Revisa y actualiza el estado de las tareas que te ha asignado el administrador.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Título de la Tarea</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {taskList && taskList.map((task) => (
                <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.description}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                    <Badge variant={statusBadgeVariant[task.status as TaskStatus]}>
                        {task.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openDetailsModal(task)}>
                            Ver Descripción
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Cambiar Estado</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                                value={task.status}
                                onValueChange={(value) => handleStatusChange(task.id, value as TaskStatus)}
                            >
                                <DropdownMenuRadioItem value="Pendiente">Pendiente</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="En Progreso">En Progreso</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="Completada">Completada</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
             {(!taskList || taskList.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No tienes tareas asignadas.</p>
            )}
        </CardContent>
        </Card>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedTask?.title || "Detalle de la tarea"}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">{selectedTask?.description}</p>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
