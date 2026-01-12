
'use client';

import { useState } from 'react';
import { payments, athletes, type Payment } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ManagerPaymentsPage() {
  const { toast } = useToast();
  const [paymentList, setPaymentList] = useState<Payment[]>(payments);

  const pendingVerifications = paymentList.filter(p => p.status === 'En Verificación');

  const getAthleteName = (athleteId: number) => {
    return athletes.find(a => a.id === athleteId)?.name || 'Desconocido';
  };

  const handlePaymentAction = (paymentId: number, newStatus: 'Pagado' | 'Rechazado') => {
    setPaymentList(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
    const actionText = newStatus === 'Pagado' ? 'aprobado' : 'rechazado';
    toast({
        title: `Pago ${actionText}`,
        description: `El pago ha sido marcado como ${actionText}.`,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><FileClock /> Pagos por Verificar</CardTitle>
          <CardDescription>
            Revisa y aprueba los pagos registrados por los deportistas.
          </CardDescription>
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
                                <Button size="sm" variant="outline" onClick={() => handlePaymentAction(payment.id, 'Rechazado')}>
                                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                    Rechazar
                                </Button>
                                <Button size="sm" onClick={() => handlePaymentAction(payment.id, 'Pagado')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aprobar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            ): (
                <p className="text-center text-muted-foreground py-8">No hay pagos pendientes de verificación en este momento.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial General de Pagos</CardTitle>
          <CardDescription>
            Consulta el estado de todos los pagos del club.
          </CardDescription>
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
                    {paymentList.map(payment => (
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
        </CardContent>
      </Card>
    </div>
  );
}
