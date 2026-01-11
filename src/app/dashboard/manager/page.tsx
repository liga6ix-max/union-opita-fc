"use client";

import { athletes, coaches, payments, tasks } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, ClipboardList, BarChart, LineChart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart as RechartsLineChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const totalAthletes = athletes.length;
const totalCoaches = coaches.length;
const paymentsDue = payments.filter(p => p.status === 'Pendiente').length;

const paymentStatusData = [
    { status: "Pagado", count: payments.filter(p => p.status === 'Pagado').length, fill: "hsl(var(--chart-1))" },
    { status: "Pendiente", count: paymentsDue, fill: "hsl(var(--destructive))" },
]

const enrollmentData = [
    { month: "Mar", count: 5 },
    { month: "Abr", count: 8 },
    { month: "May", count: 12 },
    { month: "Jun", count: 15 },
    { month: "Jul", count: 20 },
    { month: "Ago", count: 22 },
]

const chartConfig = {
  count: {
    label: "Cantidad",
  },
};

export default function ManagerDashboard() {
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
            <CardTitle className="flex items-center gap-2 font-headline"><BarChart /> Estado de Pagos (Agosto)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsBarChart accessibilityLayer data={paymentStatusData} layout="vertical" margin={{left: 10}}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="count" hide />
                <YAxis
                    dataKey="status"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={80}
                />
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
                    {tasks.slice(0, 4).map(task => {
                        const coach = coaches.find(c => c.id === task.assignedTo);
                        return (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>{coach?.name || 'N/A'}</TableCell>
                                <TableCell>{task.deadline}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
