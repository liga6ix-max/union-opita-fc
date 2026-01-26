"use client";

import { useUser, useCollection, useMemoFirebase, useFirebase } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, ClipboardList, BarChart, LineChart, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart as RechartsLineChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

const MAIN_CLUB_ID = 'OpitaClub';

const chartConfig = {
  count: { label: "Cantidad" },
  Deportistas: { label: "Deportistas", color: "hsl(var(--chart-1))" },
};

export default function ManagerDashboard() {
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const athletesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/athletes`);
  }, [firestore]);
  const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
  }, [firestore]);
  const { data: payments, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/tasks`), orderBy("dueDate", "desc"), limit(4));
  }, [firestore]);
  const { data: tasks, isLoading: tasksLoading } = useCollection(tasksQuery);
  
  const allClubUsersQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, `users`), where("clubId", "==", MAIN_CLUB_ID));
  }, [firestore, profile]);
  const { data: allClubUsers, isLoading: allUsersLoading } = useCollection(allClubUsersQuery);


  if (isUserLoading || athletesLoading || paymentsLoading || tasksLoading || allUsersLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalAthletes = allClubUsers?.filter(u => u.role === 'athlete' || u.role === 'unifit').length || 0;
  const totalCoaches = allClubUsers?.filter(u => u.role === 'coach').length || 0;
  const paymentsDue = payments?.filter(p => p.status === 'Pendiente').length || 0;

  const paymentStatusData = [
      { status: "Pagado", count: payments?.filter(p => p.status === 'Pagado').length || 0, fill: "hsl(var(--chart-1))" },
      { status: "Pendiente", count: paymentsDue, fill: "hsl(var(--destructive))" },
  ]

  // This is mock data, would need real historical data for a real chart
  const enrollmentData = [
      { month: "Mar", count: 5 }, { month: "Abr", count: 8 },
      { month: "May", count: 12 }, { month: "Jun", count: 15 },
      { month: "Jul", count: 20 }, { month: "Ago", count: totalAthletes },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deportistas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAthletes}</div>
            <p className="text-xs text-muted-foreground">Miembros activos en el club</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentsDue}</div>
            <p className="text-xs text-muted-foreground">Cuotas de este mes por cobrar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrenadores Activos</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoaches}</div>
            <p className="text-xs text-muted-foreground">Personal dirigiendo equipos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><BarChart /> Estado de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsBarChart accessibilityLayer data={paymentStatusData} layout="vertical" margin={{left: 10}}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="count" hide />
                <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={5} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><LineChart /> Nuevos Deportistas (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <RechartsLineChart accessibilityLayer data={enrollmentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Tareas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tarea</TableHead>
                        <TableHead>Asignado a</TableHead>
                        <TableHead>Fecha Límite</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks && tasks.map(task => {
                        const coach = allClubUsers?.find(c => c.id === task.assigneeId);
                        return (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.description}</TableCell>
                                <TableCell>{coach?.firstName || 'N/A'}</TableCell>
                                <TableCell>{task.dueDate}</TableCell>
                                <TableCell>
                                    <Badge variant={task.status === 'Completada' ? 'default' : task.status === 'En Progreso' ? 'secondary' : 'destructive'}>
                                        {task.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
             {(!tasks || tasks.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No hay tareas recientes.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
