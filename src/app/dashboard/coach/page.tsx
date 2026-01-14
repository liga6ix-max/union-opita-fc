
'use client';

import { useFirebase, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, Wallet, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collection, query, where } from 'firebase/firestore';

export default function CoachDashboard() {
  const { profile, isUserLoading, firestore } = useUser();

  const athletesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.id || !profile?.clubId) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/athletes`), where("coachId", "==", profile.id));
  }, [firestore, profile?.id, profile?.clubId]);
  
  const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.id || !profile?.clubId) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/tasks`), where("assigneeId", "==", profile.id));
  }, [firestore, profile?.id, profile?.clubId]);

  const { data: tasks, isLoading: tasksLoading } = useCollection(tasksQuery);

  if (isUserLoading || athletesLoading || tasksLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  const assignedAthletesCount = athletes?.length || 0;
  const pendingTasksCount = tasks?.filter(t => t.status !== 'Completada').length || 0;
  
  // Salary is not available on the user profile in this structure
  // This would need to be fetched from a separate 'staff' or similar collection if needed.
  // const coachSalary = profile?.salary || 0; 

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Deportistas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedAthletesCount}</div>
            <p className="text-xs text-muted-foreground">Atletas bajo tu supervisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">Tareas por completar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salario Mensual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">Información no disponible</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Mis Tareas Asignadas</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tarea</TableHead>
                        <TableHead>Fecha Límite</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks && tasks.map(task => (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.description}</TableCell>
                            <TableCell>{task.dueDate}</TableCell>
                            <TableCell>
                                <Badge variant={task.status === 'Completada' ? 'default' : task.status === 'En Progreso' ? 'secondary' : 'destructive'}>
                                    {task.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm">
                                    Actualizar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {(!tasks || tasks.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No tienes tareas asignadas.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
