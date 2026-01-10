import { payments, athletes } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";

// Assuming athlete ID 1 is logged in for this demo
const currentAthleteId = 1;
const athlete = athletes.find(a => a.id === currentAthleteId);
const athletePayments = payments.filter(p => p.athleteId === currentAthleteId);

export default function AthleteDashboard() {
  if (!athlete) {
    return <div>Deportista no encontrado.</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  return (
    <div className="space-y-8">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tu Cuota Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(athlete.monthlyFee)}</div>
            <p className="text-xs text-primary-foreground/70">Este es el valor a pagar cada mes.</p>
        </CardContent>
      </Card>
      
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
                                <Badge variant={payment.status === 'Pagado' ? 'default' : 'destructive'}>
                                    {payment.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{payment.paymentDate || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                {payment.status === 'Pendiente' && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm">Registrar Pago</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Registrar Pago para {payment.month}</DialogTitle>
                                                <DialogDescription>
                                                    Confirma que has realizado el pago de {formatCurrency(payment.amount)}. El gerente verificará la transacción.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button type="submit">Confirmar Pago</Button>
                                            </DialogFooter>
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
