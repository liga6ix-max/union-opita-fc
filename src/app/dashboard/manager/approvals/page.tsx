
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

// Simulando datos de usuarios pendientes de aprobación
const initialPendingUsers = [
    { id: 'user1', name: 'Carlos Mendoza', email: 'carlos.m@example.com', role: 'Deportista', status: 'pending' },
    { id: 'user2', name: 'Laura Paez', email: 'laura.p@example.com', role: 'Entrenador', status: 'pending' },
    { id: 'user3', name: 'Pedro Pascal', email: 'pedro.p@example.com', role: 'Deportista', status: 'pending' },
];

type UserStatus = 'pending' | 'approved' | 'rejected';

type PendingUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: UserStatus;
};

export default function ApprovalsPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<PendingUser[]>(initialPendingUsers);

    const handleApproval = (userId: string, newStatus: 'approved' | 'rejected') => {
        // En una app real, aquí llamarías a tu backend/API para actualizar el estado del usuario.
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, status: newStatus } : user
        );

        // Filtramos para quitar el usuario de la lista de pendientes si ya fue aprobado o rechazado.
        const filteredUsers = updatedUsers.filter(user => user.status === 'pending');
        setUsers(filteredUsers);

        const userName = users.find(u => u.id === userId)?.name;
        toast({
            title: `Usuario ${newStatus === 'approved' ? 'Aprobado' : 'Rechazado'}`,
            description: `${userName} ha sido ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.`,
        });
    };
    
    const pendingUsers = users.filter(user => user.status === 'pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Aprobación de Nuevos Usuarios</CardTitle>
                <CardDescription>
                    Revisa los nuevos registros y aprueba o rechaza su acceso a la plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingUsers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol Solicitado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="gap-1">
                                            <Clock className="h-3 w-3" />
                                            Pendiente
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleApproval(user.id, 'rejected')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                            Rechazar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproval(user.id, 'approved')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Aprobar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        No hay usuarios pendientes de aprobación en este momento.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
