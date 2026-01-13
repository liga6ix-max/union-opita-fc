
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCog, MoreVertical, Trash2, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
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

type UserRole = 'athlete' | 'coach' | 'manager';

const roleLabels: Record<UserRole, string> = {
    athlete: 'Deportista',
    coach: 'Entrenador',
    manager: 'Gerente'
}

export default function ApprovalsPage() {
    const { toast } = useToast();
    const { profile, firestore, isUserLoading } = useUser();

    // With simplified rules, a manager can list all users.
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: userList, isLoading: usersLoading, error } = useCollection(usersQuery);
    
    if (error) {
        console.error("Firestore Error fetching users:", error);
    }
    
    const handleToggleDisable = async (userId: string, currentStatus: boolean) => {
        if (!firestore || !profile?.clubId) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se ha podido identificar el club.' });
            return;
        }
        const userDocRef = doc(firestore, 'users', userId);
        const newStatus = !currentStatus;
        try {
            await updateDoc(userDocRef, { 
              disabled: newStatus,
              // If we are enabling a user, ensure they have the clubId.
              ...(!newStatus && { clubId: profile.clubId }) 
            });
            toast({
                title: `Usuario ${newStatus ? 'Deshabilitado' : 'Habilitado'}`,
                description: `El acceso del usuario ha sido actualizado.`
            });
        } catch (e) {
            console.error("Error toggling user status:", e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el estado del usuario. Revisa los permisos.' });
        }
    };

    const handleChangeRole = async (userId: string, newRole: UserRole) => {
        if (!firestore) return;
        const clubId = profile?.clubId; 
        if (!clubId) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se ha podido identificar el club del administrador.' });
             return;
        }

        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, {
                role: newRole,
                clubId: clubId // Ensure clubId is set when role changes
            });

             // If the new role is 'athlete', ensure the subcollection document exists.
            if (newRole === 'athlete') {
                const athleteDocRef = doc(firestore, `clubs/${clubId}/athletes`, userId);
                const userToUpdate = userList?.find(u => u.id === userId);
                if (userToUpdate) {
                    await setDoc(athleteDocRef, {
                        userId: userId,
                        clubId: clubId,
                        email: userToUpdate.email,
                        firstName: userToUpdate.firstName,
                        lastName: userToUpdate.lastName,
                    }, { merge: true });
                }
            }
            toast({ title: 'Rol Actualizado', description: `El usuario ahora tiene el rol de ${roleLabels[newRole]}.` });
        } catch (e) {
             console.error("Error changing user role:", e);
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el rol del usuario. Revisa los permisos.' });
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
         if (!firestore) return;
         const userDocRef = doc(firestore, 'users', userId);
         try {
            await deleteDoc(userDocRef);
            // Optionally, delete from athlete subcollection if they were one
            if (profile?.clubId) {
                const athleteDocRef = doc(firestore, `clubs/${profile.clubId}/athletes`, userId);
                await deleteDoc(athleteDocRef).catch(() => {}); // Ignore error if it doesn't exist
            }
            toast({ title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado permanentemente.' });
         } catch (e) {
            console.error("Error deleting user:", e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al usuario. Revisa los permisos.' });
         }
    };
    
    const isLoading = isUserLoading || usersLoading;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><UserCog/> Gestión de Usuarios</CardTitle>
                    <CardDescription>
                        Habilita, deshabilita y administra los roles de todos los usuarios del club.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userList && userList.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.firstName || ''} {user.lastName || ''}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="outline">{roleLabels[user.role as UserRole] || user.role || 'N/A'}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant={user.disabled ? 'destructive' : 'default'}>
                                                {user.disabled ? 'Inhabilitado' : 'Habilitado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Gestionar Usuario</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleToggleDisable(user.id, user.disabled)}>
                                                        {user.disabled ? <ShieldCheck className="mr-2 h-4 w-4"/> : <ShieldOff className="mr-2 h-4 w-4"/>}
                                                        {user.disabled ? 'Habilitar' : 'Inhabilitar'}
                                                    </DropdownMenuItem>
                                                     <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'athlete')} disabled={user.role === 'athlete'}>Asignar como Deportista</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'coach')} disabled={user.role === 'coach'}>Asignar como Entrenador</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'manager')} disabled={user.role === 'manager'}>Asignar como Gerente</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4"/>Eliminar Usuario
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {(!isLoading && (!userList || userList.length === 0)) && (
                        <p className="text-center py-8 text-muted-foreground">No hay usuarios registrados en el sistema.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
