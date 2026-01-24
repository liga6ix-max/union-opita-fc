
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Landmark, Banknote, Hash, User, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const paymentSchema = z.object({
    paymentDate: z.string().min(1, "La fecha de pago es requerida."),
    referenceNumber: z.string().min(4, { message: "El número de referencia debe tener al menos 4 caracteres."}),
    amount: z.number(),
    month: z.string(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type PaymentStatus = 'Pagado' | 'Pendiente' | 'En Verificación' | 'Rechazado';
const MAIN_CLUB_ID = 'OpitaClub';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const statusBadgeVariant: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
    'Pagado': 'default', 'Pendiente': 'destructive', 'En Verificación': 'secondary', 'Rechazado': 'outline',
};

export default function UnifitPaymentsPage() {
    const { toast } = useToast();
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);
    const { user, isUserLoading, firestore } = useUser();

    // Club Config data hook
    const clubConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'clubs', MAIN_CLUB_ID);
    }, [firestore]);
    const { data: clubConfig, isLoading: isClubConfigLoading } = useDoc(clubConfigRef);

    // Payment data hooks
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        const paymentsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/payments`);
        return query(paymentsCollection, where("athleteId", "==", user.uid));
    }, [firestore, user?.uid]);
    const { data: userPayments, isLoading: arePaymentsLoading } = useCollection(paymentsQuery);

    const paymentForm = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { paymentDate: "", referenceNumber: "", amount: 0, month: "" },
    });
    
    const handleOpenDialog = (payment: any) => {
        paymentForm.reset({
            paymentDate: "",
            referenceNumber: "",
            amount: payment.amount,
            month: payment.month,
        });
        setOpenDialogId(payment.id);
    };

    const onPaymentSubmit = (data: PaymentFormValues, paymentId: string) => {
        if (!firestore) return;

        const paymentRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/payments`, paymentId);
        updateDocumentNonBlocking(paymentRef, {
            status: 'En Verificación',
            paymentDate: data.paymentDate,
            referenceNumber: data.referenceNumber,
            updatedAt: serverTimestamp()
        });
        toast({ title: "¡Registro de Pago Enviado!", description: `Tu pago para ${data.month} ha sido enviado para verificación.` });
        setOpenDialogId(null);
        paymentForm.reset();
    }

    const isLoading = isUserLoading || arePaymentsLoading || isClubConfigLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const monthlyFee = (clubConfig?.monthlyFees as Record<string, number>)?.[user?.role?.toUpperCase() === 'UNIFIT' ? 'UNIFIT' : ''] || 0;

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Mis Pagos</CardTitle>
                    <CardDescription>Tu cuota mensual actual es de <span className="font-bold text-primary">{formatCurrency(monthlyFee)}</span>.</CardDescription>
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
                            {userPayments?.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.month}</TableCell>
                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell><Badge variant={statusBadgeVariant[payment.status as PaymentStatus]}>{payment.status}</Badge></TableCell>
                                    <TableCell>{payment.paymentDate || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        {(payment.status === 'Pendiente' || payment.status === 'Rechazado') && (
                                            <Dialog open={openDialogId === payment.id} onOpenChange={(isOpen) => setOpenDialogId(isOpen ? payment.id : null)}>
                                                <DialogTrigger asChild><Button size="sm" onClick={() => handleOpenDialog(payment)}>Registrar Pago</Button></DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Registrar Pago para {payment.month}</DialogTitle>
                                                        <DialogDescription>Realiza la transferencia y registra los detalles.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                                                        <h4 className="font-semibold text-center text-primary">Datos para la Transferencia</h4>
                                                        <div className="flex items-center gap-4"><Landmark className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{clubConfig?.bankAccount?.bankName}</p></div></div>
                                                        <div className="flex items-center gap-4"><Banknote className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Tipo de Cuenta</p><p className="font-medium">{clubConfig?.bankAccount?.accountType}</p></div></div>
                                                        <div className="flex items-center gap-4"><Hash className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Número de Cuenta</p><p className="font-medium">{clubConfig?.bankAccount?.accountNumber}</p></div></div>
                                                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Titular</p><p className="font-medium">{clubConfig?.bankAccount?.accountHolder}</p></div></div>
                                                        <div className="flex items-center gap-4"><Info className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Valor a pagar</p><p className="font-medium">{formatCurrency(payment.amount)}</p></div></div>
                                                    </div>
                                                    <Separator />
                                                    <Form {...paymentForm}>
                                                        <form onSubmit={paymentForm.handleSubmit((data) => onPaymentSubmit(data, payment.id))} className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <FormField control={paymentForm.control} name="month" render={({ field }) => (<FormItem><FormLabel>Mes a Pagar</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)}/>
                                                                <FormField control={paymentForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Valor (COP)</FormLabel><FormControl><Input type="text" value={formatCurrency(field.value)} readOnly disabled /></FormControl><FormMessage /></FormItem>)}/>
                                                            </div>
                                                            <FormField control={paymentForm.control} name="paymentDate" render={({ field }) => (<FormItem><FormLabel>Fecha de la Transferencia</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                            <FormField control={paymentForm.control} name="referenceNumber" render={({ field }) => (<FormItem><FormLabel>Número de Referencia</FormLabel><FormControl><Input placeholder="Ej: 123456789" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                            <DialogFooter className="pt-4"><Button type="submit" disabled={paymentForm.formState.isSubmitting}>{paymentForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Pago'}</Button></DialogFooter>
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
                    {(!userPayments || userPayments.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">No tienes pagos registrados.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
