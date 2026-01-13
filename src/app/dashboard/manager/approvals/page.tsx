'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2, MoreVertical } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserStatus = 'pending' | 'approved' | 'rejected';
type UserRole = 'athlete' | 'coach' | 'manager';

export default function ApprovalsPage() {
    const { toast } = useToast();
    const { profile, firestore, isUserLoading } = useUser();

    // Simplified query for a single-club app: just get all pending users.
    const pendingUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'pending'));
    }, [firestore]);

    const { data: pendingUsers, isLoading: usersLoading } = useCollection(pendingUsersQuery);

    const handleApproval = async (userId: string, newRole: UserRole) => {
        if (!firestore || !profile?.clubId) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener la información del club del gerente.' });
            return;
        }

        const userToApprove = pendingUsers?.find(u => u.id === userId);
        if (!userToApprove) return;

        const userDocRef = doc(firestore, 'users', userId);

        try {
            await updateDoc(userDocRef, {
                role: newRole,
                clubId: profile.clubId, // Assign the manager's clubId upon approval
            });

            // If the new role is 'athlete', create a corresponding document in the athletes subcollection
            if (newRole === 'athlete') {
                const athleteDocRef = doc(firestore, `clubs/${profile.clubId}/athletes`, userId);
                await setDoc(athleteDocRef, {
                    userId: userId,
                    clubId: profile.clubId,
                    email: userToApprove.email,
                    firstName: userToApprove.firstName,
                    lastName: userToApprove.lastName,
                    // Initialize other athlete fields as needed (e.g., empty strings or null)
                    team: null,
                    coachId: null,
                    birthDate: null,
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    medicalInformation: '',
                }, { merge: true });
            }

            toast({
                title: `Usuario Aprobado`,
                description: `${userToApprove.firstName} ha sido aprobado como ${newRole}.`,
            });
        } catch (error) {
            console.error("Error approving user:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aprobar al usuario.' });
        }
    };
    
    const handleReject = async (userId: string) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, 'users', userId);
        const userName = pendingUsers?.find(u => u.id === userId)?.firstName;

        try {
            // Instead of deleting, you might want to set their role to 'rejected'
            // For now, we delete the user document as per original logic.
            await deleteDoc(userDocRef);
            toast({
                title: `Usuario Rechazado`,
                description: `La solicitud de ${userName} ha sido rechazada y eliminada.`,
            });
             // Note: This does not delete the user from Firebase Auth, only Firestore.
             // A manual step in the Firebase Console would be required for full deletion.
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo rechazar al usuario.' });
        }
    };
    
    if (isUserLoading || usersLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Aprobación de Nuevos Usuarios</CardTitle>
                <CardDescription>
                    Revisa los nuevos registros y aprueba o rechaza su acceso a la plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingUsers && pendingUsers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="gap-1">
                                            <Clock className="h-3 w-3" />
                                            Pendiente
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleReject(user.id)}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Rechazar
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Aprobar Como...
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleApproval(user.id, 'athlete')}>
                                                    Deportista
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleApproval(user.id, 'coach')}>
                                                    Entrenador
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleApproval(user.id, 'manager')}>
                                                    Gerente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
