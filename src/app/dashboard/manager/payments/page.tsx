
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileClock, PlusCircle, Loader2, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { user, profile, firestore, isUserLoading } = useUser();

  // Guard: Only fetch if we have a manager session
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'manager') return null;
    // We query ALL users to ensure we find names even if clubId is missing/delayed
    return collection(firestore, 'users');
  }, [firestore, user, profile?.role]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersQuery);

  const usersMap = useMemo(() => {
    if (!allUsers) return new Map();
    return new Map(allUsers.map(user => [user.id, user]));
  }, [allUsers]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'manager') return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
  }, [firestore, user, profile?.role]);
  const { data: paymentList, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const form = useForm<PaymentScheduleFormValues>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: { month: '', amount: 50000 },
  });

  const onScheduleSubmit = (data: PaymentScheduleFormValues) => {
    if (!firestore || !allUsers || !paymentList) return;
    
    const billableUsers = allUsers.filter(u => u.clubId === MAIN_CLUB_ID && (u.role === 'athlete' || u.role === 'unifit'));

    if (billableUsers.length === 0) {
      toast({ title: 'Sin Deportistas', description: 'No hay deportistas registrados para cobrar.' });
      return;
    }

    const paymentsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
    const usersWithExistingPayment = new Set(
        paymentList.filter(p => p.month === data.month).map(p => p.userId)
    );

    const usersToBill = billableUsers.filter(u => !usersWithExistingPayment.has(u.id));

    if (usersToBill.length === 0) {
        toast({ title: 'Sin cobros nuevos', description: 'Todos los usuarios ya tienen asignado este mes.' });
        setIsDialogOpen(false);
        return;
    }
    
    usersToBill.forEach(u => {
        const newRef = doc(paymentsCollection);
        setDocumentNonBlocking(newRef, {
          userId: u.id,
          month: data.month,
          amount: data.amount,
          status: 'Pendiente',
          clubId: MAIN_CLUB_ID
        }, {});
    });

    toast({ title: 'Pagos Programados', description: `Se crearon ${usersToBill.length} cuotas para ${data.month}.` });
    setIsDialogOpen(false);
    form.reset();
  };
  
  const pendingVerifications = paymentList?.filter(p => p.status === 'En Verificación') || [];

  const handlePaymentAction = (paymentId: string, newStatus: 'Pagado' | 'Rechazado') => {
    if (!firestore) return;
    const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentId);
    updateDocumentNonBlocking(paymentRef, { status: newStatus });
    toast({ title: `Pago ${newStatus === 'Pagado' ? 'aprobado' : 'rechazado'}` });
  };
  
  const handleDeletePayment = () => {
    if (!paymentToDelete || !firestore) return;
    const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentToDelete);
    deleteDocumentNonBlocking(paymentRef);
    toast({ title: 'Pago Eliminado' });
    setIsDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

  const isLoading = isUserLoading || paymentsLoading || usersLoading;
  
  if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><FileClock /> Pagos por Verificar</CardTitle>
            <CardDescription>Revisa y aprueba los reportes de pago de los deportistas.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Programar Pagos</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Programar Cuotas Mensuales</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onScheduleSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="month" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes</FormLabel>
                        <FormControl><Input placeholder="Ej: Octubre 2024" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto (COP)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Programar Cuotas</Button>
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
                        <TableHead>Usuario</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Fecha Reporte</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pendingVerifications.map((payment) => {
                        const targetUser = usersMap.get(payment.userId);
                        return (
                          <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                {targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Desconocido'}
                              </TableCell>
                              <TableCell>{payment.month}</TableCell>
                              <TableCell>{payment.paymentDate}</TableCell>
                              <TableCell className="text-right space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handlePaymentAction(payment.id, 'Rechazado')}><XCircle className="h-4 w-4" /></Button>
                                  <Button size="sm" onClick={() => handlePaymentAction(payment.id, 'Pagado')}><CheckCircle className="h-4 w-4" /></Button>
                              </TableCell>
                          </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
            ): (
                <p className="text-center text-muted-foreground py-8">No hay reportes de pago pendientes.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="font-headline">Historial General</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Borrar</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentList?.map(p => {
                      const targetUser = usersMap.get(p.userId);
                      return (
                        <TableRow key={p.id}>
                            <TableCell>{targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Desconocido'}</TableCell>
                            <TableCell>{p.month}</TableCell>
                            <TableCell>{p.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                            <TableCell><Badge variant={p.status === 'Pagado' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setPaymentToDelete(p.id); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
