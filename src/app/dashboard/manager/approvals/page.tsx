'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2, MoreVertical, Trash2, UserCog, Users } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';

type UserRole = 'athlete' | 'coach' | 'manager' | 'pending';

const roleLabels: Record<UserRole, string> = {
    pending: 'Pendiente',
    athlete: 'Deportista',
    coach: 'Entrenador',
    manager: 'Gerente'
}

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
    pending: 'secondary',
    athlete: 'default',
    coach: 'outline',
    manager: 'default'
}

export default function ApprovalsPage() {
    const { toast } = useToast();
    const { profile, firestore, isUserLoading } = useUser();

    // Query for all users associated with the manager's club, OR users who are pending (and might not have a clubId yet)
    // For a single-club app, this effectively gets all relevant users.
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId) return null;
        return query(collection(firestore, 'users'), where('clubId', 'in', [profile.clubId, '']));
    }, [firestore, profile?.clubId]);

    const { data: userList, isLoading: usersLoading } = useCollection(usersQuery);
    
    const pendingUsers = userList?.filter(u => u.role === 'pending');
    const activeUsers = userList?.filter(u => u.role !== 'pending');


    const handleUserAction = async (userId: string, newRoleOrAction: UserRole | 'delete') => {
        if (!firestore || !profile?.clubId) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener la información del club.' });
            return;
        }

        const userToUpdate = userList?.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        const userDocRef = doc(firestore, 'users', userId);

        if (newRoleOrAction === 'delete') {
            try {
                await deleteDoc(userDocRef);
                // Also delete the athlete subcollection document if they were an athlete
                if (userToUpdate.role === 'athlete') {
                    const athleteDocRef = doc(firestore, `clubs/${profile.clubId}/athletes`, userId);
                    await deleteDoc(athleteDocRef);
                }
                toast({ title: `Usuario Eliminado`, description: `${userToUpdate.firstName} ha sido eliminado de la plataforma.` });
            } catch (error) {
                console.error("Error deleting user:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al usuario.' });
            }
            return;
        }

        // It's a role change/approval
        const newRole = newRoleOrAction as UserRole;
        try {
            await updateDoc(userDocRef, {
                role: newRole,
                clubId: profile.clubId, // Assign manager's clubId on any role change/approval
            });

            // If the new role is 'athlete', create/ensure the subcollection document exists.
            if (newRole === 'athlete') {
                const athleteDocRef = doc(firestore, `clubs/${profile.clubId}/athletes`, userId);
                await setDoc(athleteDocRef, {
                    userId: userId,
                    clubId: profile.clubId,
                    email: userToUpdate.email,
                    firstName: userToUpdate.firstName,
                    lastName: userToUpdate.lastName,
                }, { merge: true }); // Use merge to not overwrite existing athlete data
            }
             toast({
                title: `Usuario Actualizado`,
                description: `${userToUpdate.firstName} ahora tiene el rol de ${roleLabels[newRole]}.`,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol del usuario.' });
        }
    };
    
    if (isUserLoading || usersLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><UserCog/> Gestión de Usuarios</CardTitle>
                    <CardDescription>
                        Aprueba nuevos registros y administra los roles de los usuarios existentes en el club.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="mb-4 text-lg font-semibold flex items-center gap-2"><Clock />Nuevas Solicitudes</h3>
                    {pendingUsers && pendingUsers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleUserAction(user.id, 'delete')}><XCircle className="mr-2 h-4 w-4" /> Rechazar</Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm"><CheckCircle className="mr-2 h-4 w-4" /> Aprobar Como...</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'athlete')}>Deportista</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'coach')}>Entrenador</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'manager')}>Gerente</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay usuarios pendientes de aprobación.</p>
                    )}
                </CardContent>
                 <CardContent>
                    <h3 className="mb-4 text-lg font-semibold flex items-center gap-2"><Users />Usuarios Activos</h3>
                    {activeUsers && activeUsers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol Actual</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={roleBadgeVariant[user.role as UserRole]}>
                                                {roleLabels[user.role as UserRole]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Gestionar Usuario</DropdownMenuLabel>
                                                     <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'athlete')} disabled={user.role === 'athlete'}>Asignar como Deportista</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'coach')} disabled={user.role === 'coach'}>Asignar como Entrenador</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'manager')} disabled={user.role === 'manager'}>Asignar como Gerente</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleUserAction(user.id, 'delete')}>
                                                        <Trash2 className="mr-2 h-4 w-4"/>Eliminar Usuario
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay usuarios activos en el club.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
