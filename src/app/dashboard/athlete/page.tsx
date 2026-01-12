
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { payments, athletes, coaches, type PaymentStatus } from "@/lib/data";
import clubConfig from "@/lib/club-config.json";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, Banknote, Landmark, User, Hash, Info, Shield, Trophy } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const paymentSchema = z.object({
    paymentDate: z.date({
        required_error: "La fecha de pago es requerida.",
    }),
    referenceNumber: z.string().min(4, { message: "El número de referencia debe tener al menos 4 caracteres."}),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

// Assuming athlete ID 1 is logged in for this demo
const currentAthleteId = 1;
const athlete = athletes.find(a => a.id === currentAthleteId);
const athletePayments = payments.filter(p => p.athleteId === currentAthleteId);
const coach = athlete ? coaches.find(c => c.id === athlete.coachId) : undefined;
const hasPendingPayment = athletePayments.some(p => p.status === 'Pendiente');

const monthlyFee = athlete ? (clubConfig.monthlyFees as Record<string, number>)[athlete.team] || 0 : 0;


export default function AthleteDashboard() {
  const { toast } = useToast();
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        referenceNumber: "",
    },
  });

  if (!athlete) {
    return <div>Deportista no encontrado.</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  const onSubmit = (data: PaymentFormValues, month: string) => {
    console.log(`Pago registrado para ${month}:`, data);
    // Here you would typically update the payment status to 'En Verificación' in your database
    toast({
        title: "¡Registro de Pago Enviado!",
        description: `Tu pago para ${month} ha sido enviado para verificación.`,
    });
    setOpenDialogId(null);
    form.reset();
  }
  
  const statusBadgeVariant: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
    'Pagado': 'default',
    'Pendiente': 'destructive',
    'En Verificación': 'secondary',
    'Rechazado': 'destructive',
  };

  return (
    <div className="space-y-8">

        {hasPendingPayment && (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Notificación Importante</AlertTitle>
                <AlertDescription>
                    Tienes una cuota de pago pendiente. Por favor, realiza el pago para poder continuar con los entrenamientos.
                </AlertDescription>
            </Alert>
        )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tu Cuota Mensual</CardTitle>
                <DollarSign className="h-4 w-4 text-primary-foreground/70" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyFee)}</div>
                <p className="text-xs text-primary-foreground/70">Este es el valor a pagar cada mes.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tu Entrenador</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{coach?.name || 'No asignado'}</div>
                <p className="text-xs text-muted-foreground">Tu guía en el campo.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tu Equipo</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{athlete.team}</div>
                <p className="text-xs text-muted-foreground">La categoría en la que compites.</p>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Pago</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {athletePayments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.month}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>
                                <Badge variant={statusBadgeVariant[payment.status]}>
                                    {payment.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{payment.paymentDate || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                {(payment.status === 'Pendiente' || payment.status === 'Rechazado') && (
                                    <Dialog open={openDialogId === payment.id} onOpenChange={(isOpen) => setOpenDialogId(isOpen ? payment.id : null)}>
                                        <DialogTrigger asChild>
                                            <Button size="sm">Registrar Pago</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Registrar Pago para {payment.month}</DialogTitle>
                                                <DialogDescription>
                                                    Realiza la transferencia al siguiente destino y luego registra los detalles aquí.
                                                </DialogDescription>
                                            </DialogHeader>
                                            
                                            <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                                                <h4 className="font-semibold text-center text-primary">Datos para la Transferencia</h4>
                                                <div className="flex items-center gap-4"><Landmark className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{clubConfig.bankAccount.bankName}</p></div></div>
                                                <div className="flex items-center gap-4"><Banknote className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Tipo de Cuenta</p><p className="font-medium">{clubConfig.bankAccount.accountType}</p></div></div>
                                                <div className="flex items-center gap-4"><Hash className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Número de Cuenta</p><p className="font-medium">{clubConfig.bankAccount.accountNumber}</p></div></div>
                                                <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Titular</p><p className="font-medium">{clubConfig.bankAccount.accountHolder}</p></div></div>
                                                <div className="flex items-center gap-4"><Info className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Valor a pagar</p><p className="font-medium">{formatCurrency(payment.amount)}</p></div></div>
                                            </div>

                                            <Separator />

                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit((data) => onSubmit(data, payment.month))} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="paymentDate"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                            <FormLabel>Fecha de la Transferencia</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                    >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP", { locale: es })
                                                                    ) : (
                                                                        <span>Elige una fecha</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                    date > new Date() || date < new Date("1900-01-01")
                                                                    }
                                                                    initialFocus
                                                                    locale={es}
                                                                />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="referenceNumber"
                                                        render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Número de Referencia</FormLabel>
                                                            <FormControl>
                                                            <Input placeholder="Ej: 123456789" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                        )}
                                                    />
                                                    <DialogFooter className="pt-4">
                                                        <Button type="submit">Confirmar Pago</Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
