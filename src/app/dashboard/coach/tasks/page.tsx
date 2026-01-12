
'use client';

import { useState } from 'react';
import { tasks, coaches, type Task, type TaskStatus } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
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

// Asumiendo que el entrenador con ID 1 ha iniciado sesión
const currentCoachId = 1;
const coachTasks = tasks.filter((task) => task.assignedTo === currentCoachId);

const statusBadgeVariant: Record<TaskStatus, "default" | "secondary" | "destructive"> = {
    'Completada': 'default',
    'En Progreso': 'secondary',
    'Pendiente': 'destructive'
};

export default function CoachTasksPage() {
  const { toast } = useToast();
  const [taskList, setTaskList] = useState<Task[]>(coachTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    setTaskList((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    toast({
        title: '¡Estado de la Tarea Actualizado!',
        description: `La tarea ha sido marcada como "${newStatus}".`,
    })
  };

  const openDetailsModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
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
                {taskList.map((task) => (
                <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.deadline}</TableCell>
                    <TableCell>
                    <Badge variant={statusBadgeVariant[task.status]}>
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
        </CardContent>
        </Card>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedTask?.title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">{selectedTask?.description}</p>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
