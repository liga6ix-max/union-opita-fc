'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import clubConfig from '@/lib/club-config.json';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
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
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  // Single, reliable query for all users in the system.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersQuery);

  // Memoized map for efficient user lookup.
  const usersMap = useMemo(() => {
    if (!allUsers) return new Map();
    return new Map(allUsers.map(user => [user.id, user]));
  }, [allUsers]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
  }, [firestore]);
  const { data: paymentList, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const form = useForm<PaymentScheduleFormValues>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: { month: '', amount: 50000 }, // Default fee
  });

  const onScheduleSubmit = (data: PaymentScheduleFormValues) => {
    if (!firestore || !allUsers || !paymentList) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos necesarios para programar los pagos.' });
        return;
    }
    
    // Derive billable users from the single source of truth `allUsers`
    const billableUsers = allUsers.filter(u => u.clubId === MAIN_CLUB_ID && (u.role === 'athlete' || u.role === 'unifit'));

    if (billableUsers.length === 0) {
      toast({ title: 'Sin Deportistas', description: 'No hay deportistas o miembros de UNIFIT para programarles pagos.' });
      return;
    }

    const paymentsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
    
    const usersWithExistingPayment = new Set(
        paymentList
            .filter(p => p.month === data.month)
            .map(p => p.userId)
    );

    const usersToBill = billableUsers.filter(user => !usersWithExistingPayment.has(user.id));

    if (usersToBill.length === 0) {
        toast({
            title: 'No se crearon pagos nuevos',
            description: `Todos los usuarios facturables ya tienen una cuota de pago programada para ${data.month}.`,
        });
        setIsDialogOpen(false);
        form.reset();
        return;
    }
    
    let newPaymentsCount = 0;
    usersToBill.forEach(user => {
        const newPaymentRef = doc(paymentsCollection);
        const newPaymentData = {
          userId: user.id,
          month: data.month,
          amount: data.amount,
          status: 'Pendiente',
          clubId: MAIN_CLUB_ID
        };
        setDocumentNonBlocking(newPaymentRef, newPaymentData, {});
        newPaymentsCount++;
    });

    toast({
        title: 'Pagos Programados Exitosamente',
        description: `Se crearon ${newPaymentsCount} nuevas cuotas de pago para el mes de ${data.month}.`,
    });
    
    setIsDialogOpen(false);
    form.reset();
  };
  
  const pendingVerifications = paymentList?.filter(p => p.status === 'En Verificación') || [];

  const handlePaymentAction = (paymentId: string, newStatus: 'Pagado' | 'Rechazado') => {
    if (!firestore) return;
    const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentId);
    updateDocumentNonBlocking(paymentRef, { status: newStatus });
    const actionText = newStatus === 'Pagado' ? 'aprobado' : 'rechazado';
    toast({ title: `Pago ${actionText}`, description: `El pago ha sido marcado como ${actionText}.` });
  };
  
  const handleDeletePayment = () => {
    if (!paymentToDelete || !firestore) return;
    const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentToDelete);
    deleteDocumentNonBlocking(paymentRef);
    toast({ title: 'Pago Eliminado', description: 'La cuota de pago ha sido eliminada correctamente.' });
    setIsDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

  const openDeleteDialog = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setIsDeleteDialogOpen(true);
  };
  
  const isLoading = isUserLoading || paymentsLoading || usersLoading;
  
  if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
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
                          <TableHead>Usuario</TableHead>
                          <TableHead>Mes</TableHead>
                          <TableHead>Fecha Reporte</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {pendingVerifications.map((payment) => {
                          const user = usersMap.get(payment.userId);
                          const roleLabel = user?.role === 'athlete' ? 'Deportista' : user?.role === 'unifit' ? 'UNIFIT' : '';
                          return (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                  <div>{user ? `${user.firstName} ${user.lastName}` : 'Desconocido'}</div>
                                  {user && roleLabel && <div className="text-xs text-muted-foreground">{roleLabel}</div>}
                                </TableCell>
                                <TableCell>{payment.month}</TableCell>
                                <TableCell>{payment.paymentDate}</TableCell>
                                <TableCell>{payment.referenceNumber}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handlePaymentAction(payment.id, 'Rechazado')}><XCircle className="mr-2 h-4 w-4 text-destructive" />Rechazar</Button>
                                    <Button size="sm" onClick={() => handlePaymentAction(payment.id, 'Pagado')}><CheckCircle className="mr-2 h-4 w-4" />Aprobar</Button>
                                </TableCell>
                            </TableRow>
                          );
                      })}
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
                          <TableHead>Usuario</TableHead>
                          <TableHead>Mes</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {paymentList?.map(payment => {
                        const user = usersMap.get(payment.userId);
                        const roleLabel = user?.role === 'athlete' ? 'Deportista' : user?.role === 'unifit' ? 'UNIFIT' : '';
                        return (
                          <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                <div>{user ? `${user.firstName} ${user.lastName}` : 'Desconocido'}</div>
                                {user && roleLabel && <div className="text-xs text-muted-foreground">{roleLabel}</div>}
                              </TableCell>
                              <TableCell>{payment.month}</TableCell>
                              <TableCell>{payment.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</TableCell>
                              <TableCell>
                                  <Badge variant={payment.status === 'Pagado' ? 'default' : payment.status === 'Pendiente' ? 'destructive' : 'secondary'}>
                                      {payment.status}
                                  </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openDeleteDialog(payment.id)}
                                  >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
              </Table>
              {(!paymentList || paymentList.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No hay pagos registrados.</p>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la cuota de pago del historial.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
