'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, User, Activity, Calendar, Ruler } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const MAIN_CLUB_ID = 'OpitaClub';

const measurementSchema = z.object({
    weight: z.coerce.number().positive("El peso debe ser positivo").optional().or(z.literal('')),
    height: z.coerce.number().positive("La estatura debe ser positiva").optional().or(z.literal('')),
    armRight: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    armLeft: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    legRight: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    legLeft: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    back: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    waist: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    calfRight: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    calfLeft: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

export default function UnifitAthleteProfilePage() {
    const { toast } = useToast();
    const params = useParams();
    const { profile: currentUserProfile, isUserLoading, firestore } = useUser();
    const memberId = params.id as string;
    
    // Data fetching
    const userDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'users', memberId) : null, [firestore, memberId]);
    const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

    const unifitProfileDocRef = useMemoFirebase(() => firestore ? doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`, memberId) : null, [firestore, memberId]);
    const { data: unifitProfile, isLoading: profileLoading } = useDoc(unifitProfileDocRef);

    const measurementsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${memberId}/measurements`), orderBy('date', 'desc')) : null, [firestore, memberId]);
    const { data: measurements, isLoading: measurementsLoading } = useCollection(measurementsQuery);
    
    const coachesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach")) : null, [firestore]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    const form = useForm<MeasurementFormValues>({
        resolver: zodResolver(measurementSchema),
        defaultValues: { weight: '', height: '', armRight: '', armLeft: '', legRight: '', legLeft: '', back: '', waist: '', calfRight: '', calfLeft: '' },
    });

    useEffect(() => {
        if (measurements && measurements.length > 0) {
            const latest = measurements[0];
            form.reset({
                weight: latest.weight || '', height: latest.height || '', armRight: latest.armRight || '', armLeft: latest.armLeft || '',
                legRight: latest.legRight || '', legLeft: latest.legLeft || '', back: latest.back || '', waist: latest.waist || '',
                calfRight: latest.calfRight || '', calfLeft: latest.calfLeft || '',
            });
        }
    }, [measurements, form]);

    const onAddMeasurement = (data: MeasurementFormValues) => {
        if (!firestore) return;
        
        const measurementsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${memberId}/measurements`);
        const payload = {
            ...data,
            date: serverTimestamp()
        };
        addDocumentNonBlocking(measurementsCollection, payload);
        toast({ title: "¡Medición Guardada!", description: "El nuevo registro de medidas se ha añadido al historial." });
    };

    const handleAssignCoach = (coachId: string) => {
        if (!unifitProfileDocRef) return;
        updateDocumentNonBlocking(unifitProfileDocRef, { coachId });
        toast({ title: "Entrenador Asignado", description: "Se ha actualizado el entrenador para este deportista." });
    };

    const canEdit = currentUserProfile?.role === 'manager' || currentUserProfile?.id === unifitProfile?.coachId;
    const isLoading = isUserLoading || userLoading || profileLoading || measurementsLoading || coachesLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const assignedCoach = coaches?.find(c => c.id === unifitProfile?.coachId);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Perfil UNIFIT: {userData?.firstName} {userData?.lastName}</CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardDescription>
                            Entrenador Asignado: {assignedCoach ? `${assignedCoach.firstName} ${assignedCoach.lastName}` : 'Ninguno'}
                        </CardDescription>
                        {currentUserProfile?.role === 'manager' && (
                             <Select onValueChange={handleAssignCoach} value={unifitProfile?.coachId || ''}>
                                <SelectTrigger className="w-full sm:w-[280px]">
                                    <SelectValue placeholder="Cambiar Entrenador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {coaches?.map((coach) => (
                                        <SelectItem key={coach.id} value={coach.id}>
                                            {coach.firstName} {coach.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Activity/> Registrar Nuevas Medidas</CardTitle>
                    <CardDescription>Añade un nuevo registro de medidas corporales. El sistema guardará la fecha actual.</CardDescription>
                </CardHeader>
                <CardContent>
                    {canEdit ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddMeasurement)} className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" placeholder="kg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Estatura (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="back" render={({ field }) => (<FormItem><FormLabel>Espalda (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="waist" render={({ field }) => (<FormItem><FormLabel>Cintura (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <FormField control={form.control} name="armRight" render={({ field }) => (<FormItem><FormLabel>Brazo Der. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="armLeft" render={({ field }) => (<FormItem><FormLabel>Brazo Izq. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="legRight" render={({ field }) => (<FormItem><FormLabel>Pierna Der. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="legLeft" render={({ field }) => (<FormItem><FormLabel>Pierna Izq. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="calfRight" render={({ field }) => (<FormItem><FormLabel>Gemelo Der. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="calfLeft" render={({ field }) => (<FormItem><FormLabel>Gemelo Izq. (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormMessage>)} />
                                </div>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                                    Añadir Medición al Historial
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No tienes permisos para editar este perfil.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Calendar/> Historial de Mediciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead>Altura</TableHead>
                                <TableHead>Cintura</TableHead>
                                <TableHead>Espalda</TableHead>
                                <TableHead>B. Derecho</TableHead>
                                <TableHead>B. Izquierdo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {measurements?.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.date ? format(m.date.toDate(), "d MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
                                    <TableCell>{m.weight || '-'} kg</TableCell>
                                    <TableCell>{m.height || '-'} cm</TableCell>
                                    <TableCell>{m.waist || '-'} cm</TableCell>
                                    <TableCell>{m.back || '-'} cm</TableCell>
                                    <TableCell>{m.armRight || '-'} cm</TableCell>
                                    <TableCell>{m.armLeft || '-'} cm</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {(!measurements || measurements.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">No hay mediciones registradas para este deportista.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
