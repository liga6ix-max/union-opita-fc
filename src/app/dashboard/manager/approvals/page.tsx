
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCog, MoreVertical, Trash2, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';

const MAIN_CLUB_ID = 'OpitaClub';

export default function ApprovalsPage() {
    const { toast } = useToast();
    const { user, profile, firestore, isUserLoading } = useUser();

    // Fetch ALL users to ensure immediate visibility of new registrations
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !user || profile?.role !== 'manager') return null;
        return collection(firestore, 'users');
    }, [firestore, user, profile?.role]);

    const { data: rawUsers, isLoading: usersLoading } = useCollection(usersQuery);
    
    const userList = useMemo(() => {
        if (!rawUsers) return [];
        // Filter by clubId client-side for better synchronization with new sign-ups
        return rawUsers.filter(u => u.clubId === MAIN_CLUB_ID).sort((a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? -1 : 1));
    }, [rawUsers]);

    const handleToggleDisable = (userId: string, currentStatus: boolean) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userDocRef, { disabled: !currentStatus });
        toast({ title: `Usuario ${!currentStatus ? 'Deshabilitado' : 'Habilitado'}` });
    };

    const handleChangeRole = (userId: string, newRole: string) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userDocRef, { role: newRole });
        toast({ title: 'Rol Actualizado' });
    };
    
    const handleDeleteUser = (userId: string) => {
         if (!firestore) return;
         deleteDocumentNonBlocking(doc(firestore, 'users', userId));
         deleteDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/athletes`, userId));
         deleteDocumentNonBlocking(doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`, userId));
         toast({ title: 'Usuario Eliminado' });
    };
    
    if (isUserLoading || usersLoading) {
        return <div className="flex h-full w-full items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><UserCog/> Gestión de Usuarios</CardTitle>
                    <CardDescription>Habilita el acceso a los nuevos registros aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userList.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">
                                        <div>
                                            <p>{u.firstName} {u.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={u.disabled ? 'destructive' : 'default'}>
                                            {u.disabled ? 'Pendiente / Inactivo' : 'Activo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleToggleDisable(u.id, u.disabled)}>
                                                    {u.disabled ? <ShieldCheck className="mr-2 h-4 w-4 text-green-600"/> : <ShieldOff className="mr-2 h-4 w-4"/>}
                                                    {u.disabled ? 'Habilitar Acceso' : 'Inhabilitar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleChangeRole(u.id, 'athlete')}>Deportista Fútbol</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleChangeRole(u.id, 'unifit')}>Deportista UNIFIT</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleChangeRole(u.id, 'coach')}>Entrenador</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u.id)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar Cuenta</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
