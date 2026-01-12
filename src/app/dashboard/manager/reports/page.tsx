
'use client';

import { athletes, coaches, payments } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Users, User, DollarSign, Wallet, BarChart3, LineChart } from 'lucide-react';

const totalAthletes = athletes.length;
const totalCoaches = coaches.length;

// Helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// Calculate total revenue
const totalRevenue = payments
    .filter(p => p.status === 'Pagado')
    .reduce((sum, p) => sum + p.amount, 0);

// Calculate revenue per category
const revenueByCategory = athletes.reduce((acc, athlete) => {
    const teamName = athlete.team;
    if (!acc[teamName]) {
        acc[teamName] = { name: teamName, 'Ingresos': 0 };
    }

    const athletePayments = payments.filter(p => p.athleteId === athlete.id && p.status === 'Pagado');
    const totalPaid = athletePayments.reduce((sum, p) => sum + p.amount, 0);
    acc[teamName]['Ingresos'] += totalPaid;

    return acc;
}, {} as Record<string, { name: string; Ingresos: number }>);

const revenueByCategoryData = Object.values(revenueByCategory);

// Calculate athletes per category
const athletesPerCategory = athletes.reduce((acc, athlete) => {
    acc[athlete.team] = (acc[athlete.team] || 0) + 1;
    return acc;
}, {} as Record<string, number>);

const athletesPerCategoryData = Object.entries(athletesPerCategory).map(([name, count]) => ({ name, 'Deportistas': count }));


// Simulated payroll data
const payrollData = [
    ...coaches.map(c => ({ name: c.name, role: 'Entrenador', salary: 2000000 })),
    { name: 'Gerente Admin', role: 'Administrador', salary: 3000000 }
];

const totalPayroll = payrollData.reduce((sum, item) => sum + item.salary, 0);

const chartConfig = {
    Deportistas: {
        label: 'Deportistas',
        color: 'hsl(var(--chart-1))',
    },
    Ingresos: {
        label: 'Ingresos',
        color: 'hsl(var(--chart-2))',
    },
};

export default function ManagerReportsPage() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deportistas</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAthletes}</div>
                        <p className="text-xs text-muted-foreground">Miembros activos del club</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entrenadores</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCoaches}</div>
                        <p className="text-xs text-muted-foreground">Personal técnico activo</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Suma de todas las cuotas pagadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nómina Mensual (Sim)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
                        <p className="text-xs text-muted-foreground">Costo operativo de personal</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline"><BarChart3 /> Deportistas por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <RechartsBarChart accessibilityLayer data={athletesPerCategoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} />
                                <XAxis dataKey="Deportistas" type="number" hide />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="Deportistas" fill="var(--color-Deportistas)" radius={5} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline"><LineChart /> Ingresos por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                           <RechartsBarChart accessibilityLayer data={revenueByCategoryData} margin={{ left: 20, right: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={5} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Nómina (Simulación)</CardTitle>
                    <CardDescription>Desglose de los salarios a pagar al personal del club.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Salario Mensual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.role}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.salary)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
