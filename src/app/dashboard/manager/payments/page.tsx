
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  month: z.string().min(3, 'El mes es requerido (mínimo 3 caracteres).'),
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0.'),
});

type PaymentScheduleFormValues = z.infer<typeof paymentScheduleSchema>;
const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerPaymentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { user, profile, firestore, isUserLoading } = useUser();

  const canFetch = !!user && profile?.role === 'manager';

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !canFetch) return null;
    return collection(firestore, 'users');
  }, [firestore, canFetch]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersQuery);

  const usersMap = useMemo(() => {
    if (!allUsers) return new Map();
    return new Map(allUsers.map(u => [u.id, u]));
  }, [allUsers]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !canFetch) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
  }, [firestore, canFetch]);
  const { data: paymentList, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const form = useForm<PaymentScheduleFormValues>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: { month: '', amount: 50000 },
  });

  const onScheduleSubmit = (data: PaymentScheduleFormValues) => {
    if (!firestore || !allUsers || !paymentList) {
        toast({ variant: 'destructive', title: 'Datos no listos', description: 'Por favor espera a que cargue la información.' });
        return;
    }
    
    // 1. Filtrar solo deportistas (fútbol y unifit) activos en el club
    const billableUsers = allUsers.filter(u => u.clubId === MAIN_CLUB_ID && (u.role === 'athlete' || u.role === 'unifit'));
    
    if (billableUsers.length === 0) {
        toast({ variant: 'destructive', title: 'Sin usuarios', description: 'No se encontraron deportistas registrados para cobrar.' });
        return;
    }

    const paymentsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
    
    // 2. Identificar quiénes ya tienen pago para ese mes
    const usersWithExistingPayment = new Set(
        paymentList
            .filter(p => p.month.toLowerCase().trim() === data.month.toLowerCase().trim())
            .map(p => p.userId)
    );
    
    // 3. Generar cobros solo a los que faltan
    const usersToBill = billableUsers.filter(u => !usersWithExistingPayment.has(u.id));

    if (usersToBill.length === 0) {
        toast({ title: 'Cobros al día', description: `Todos los deportistas ya tienen asignado el cobro de ${data.month}.` });
        setIsDialogOpen(false);
        return;
    }

    usersToBill.forEach(u => {
        addDocumentNonBlocking(paymentsCollection, {
          userId: u.id,
          month: data.month,
          amount: Number(data.amount),
          status: 'Pendiente',
          clubId: MAIN_CLUB_ID
        });
    });

    toast({ 
        title: '¡Cobros Generados!', 
        description: `Se han creado ${usersToBill.length} nuevas facturas para el mes de ${data.month}.` 
    });
    
    setIsDialogOpen(false);
    form.reset();
  };
  
  const pendingVerifications = paymentList?.filter(p => p.status === 'En Verificación') || [];

  const handlePaymentAction = (paymentId: string, newStatus: 'Pagado' | 'Rechazado') => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentId), { status: newStatus });
    toast({ title: `Pago ${newStatus === 'Pagado' ? 'aprobado' : 'rechazado'}` });
  };
  
  const handleDeletePayment = () => {
    if (!paymentToDelete || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentToDelete));
    toast({ title: 'Registro eliminado' });
    setIsDeleteDialogOpen(false);
  };

  if (isUserLoading || paymentsLoading || usersLoading) {
      return <div className="flex h-full w-full items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><FileClock /> Verificación de Pagos</CardTitle>
            <CardDescription>Aprueba los reportes de transferencia realizados por los deportistas.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Programar Mes</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Programar Cuotas Mensuales</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onScheduleSubmit)} className="space-y-4">
                  <FormField control={form.control} name="month" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mes a cobrar</FormLabel>
                        <FormControl><Input placeholder="Ej: Septiembre 2024" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Monto global (COP)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )}/>
                  <DialogFooter><Button type="submit">Generar Cuotas Ahora</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Mes</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {pendingVerifications.map((p) => {
                    const target = usersMap.get(p.userId);
                    return (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">{target ? `${target.firstName} ${target.lastName}` : 'Cargando...'}</TableCell>
                            <TableCell>{p.month}</TableCell>
                            <TableCell>{p.referenceNumber || 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handlePaymentAction(p.id, 'Rechazado')}><XCircle className="h-4 w-4 text-destructive" /></Button>
                                <Button size="sm" onClick={() => handlePaymentAction(p.id, 'Pagado')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            {pendingVerifications.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">No hay pagos pendientes de verificación.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="font-headline text-lg">Historial General de Pagos</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Borrar</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentList?.map(p => {
                      const target = usersMap.get(p.userId);
                      return (
                        <TableRow key={p.id}>
                            <TableCell>{target ? `${target.firstName} ${target.lastName}` : 'ID: ' + p.userId}</TableCell>
                            <TableCell>{p.month}</TableCell>
                            <TableCell>{p.amount?.toLocaleString('es-CO')} COP</TableCell>
                            <TableCell>
                                <Badge variant={p.status === 'Pagado' ? 'default' : p.status === 'Pendiente' ? 'destructive' : 'secondary'}>
                                    {p.status}
                                </Badge>
                            </TableCell>
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
            <AlertDialogHeader><AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle><AlertDialogDescription>Esta acción borrará el registro de cobro del historial. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No, cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
