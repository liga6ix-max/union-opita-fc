'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import clubConfig from '@/lib/club-config.json';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileClock, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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

const paymentScheduleSchema = z.object({
  month: z.string().min(3, 'El mes es requerido.'),
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0.'),
});

type PaymentScheduleFormValues = z.infer<typeof paymentScheduleSchema>;
type PaymentStatus = 'Pagado' | 'Pendiente' | 'En Verificación' | 'Rechazado';

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerPaymentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const { data: paymentList, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const form = useForm<PaymentScheduleFormValues>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: { month: '', amount: 50000 }, // Default fee
  });

  const onScheduleSubmit = async (data: PaymentScheduleFormValues) => {
    if (!firestore || !athletes) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los deportistas.' });
        return;
    }
    
    if (athletes.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay deportistas registrados en el club.' });
      return;
    }

    const batch = writeBatch(firestore);
    const paymentsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
    
    athletes.forEach(athlete => {
      const newPaymentRef = doc(paymentsCollection);
      batch.set(newPaymentRef, {
        athleteId: athlete.id,
        month: data.month,
        amount: data.amount,
        status: 'Pendiente',
        clubId: MAIN_CLUB_ID
      });
    });

    try {
      await batch.commit();
      toast({
        title: 'Pagos Programados',
        description: `Se crearon ${athletes.length} cuotas de pago para todos los deportistas.`,
      });
      setIsDialogOpen(false);
      form.reset();
    } catch(e) {
      console.error("Error scheduling payments:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron programar los pagos.' });
    }
  };
  
  const pendingVerifications = paymentList?.filter(p => p.status === 'En Verificación') || [];

  const getAthleteName = (athleteId: string) => {
    const athlete = athletes?.find(a => a.id === athleteId);
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Desconocido';
  };

  const handlePaymentAction = async (paymentId: string, newStatus: 'Pagado' | 'Rechazado') => {
    if (!firestore) return;
    const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentId);
    try {
      await updateDoc(paymentRef, { status: newStatus });
      const actionText = newStatus === 'Pagado' ? 'aprobado' : 'rechazado';
      toast({ title: `Pago ${actionText}`, description: `El pago ha sido marcado como ${actionText}.` });
    } catch (e) {
      console.error("Error updating payment:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el pago.' });
    }
  };
  
  if (isUserLoading || athletesLoading || paymentsLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><FileClock /> Pagos por Verificar</CardTitle>
            <CardDescription>Revisa y aprueba los pagos registrados por los deportistas.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Programar Pagos</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Programar Nuevas Cuotas de Pago</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onScheduleSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="month" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes a Cobrar</FormLabel>
                        <FormControl><Input placeholder="Ej: Septiembre 2024" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto de la Cuota (COP)</FormLabel>
                        <FormControl><Input type="number" placeholder="50000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Programar Cuotas"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
            {pendingVerifications.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Deportista</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Fecha Reporte</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pendingVerifications.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">{getAthleteName(payment.athleteId)}</TableCell>
                            <TableCell>{payment.month}</TableCell>
                            <TableCell>{payment.paymentDate}</TableCell>
                            <TableCell>{payment.referenceNumber}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handlePaymentAction(payment.id, 'Rechazado')}><XCircle className="mr-2 h-4 w-4 text-destructive" />Rechazar</Button>
                                <Button size="sm" onClick={() => handlePaymentAction(payment.id, 'Pagado')}><CheckCircle className="mr-2 h-4 w-4" />Aprobar</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            ): (
                <p className="text-center text-muted-foreground py-8">No hay pagos pendientes de verificación.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial General de Pagos</CardTitle>
          <CardDescription>Consulta el estado de todos los pagos del club.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deportista</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentList?.map(payment => (
                         <TableRow key={payment.id}>
                            <TableCell className="font-medium">{getAthleteName(payment.athleteId)}</TableCell>
                            <TableCell>{payment.month}</TableCell>
                            <TableCell>{payment.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</TableCell>
                            <TableCell>
                                <Badge variant={payment.status === 'Pagado' ? 'default' : payment.status === 'Pendiente' ? 'destructive' : 'secondary'}>
                                    {payment.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {(!paymentList || paymentList.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No hay pagos registrados.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
