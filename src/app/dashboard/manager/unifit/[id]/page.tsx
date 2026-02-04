
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
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Activity, Calendar, Trash2, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
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
import { calculateBmi, calculateBodyFatPercentage } from '@/lib/fitness';
import { Badge } from '@/components/ui/badge';


const MAIN_CLUB_ID = 'OpitaClub';

const measurementSchema = z.object({
    level: z.coerce.number().min(1).max(12).optional().or(z.literal('')),
    weight: z.coerce.number().positive("El peso debe ser positivo").optional().or(z.literal('')),
    height: z.coerce.number().positive("La estatura debe ser positiva").optional().or(z.literal('')),
    bodyFatPercentage: z.coerce.number().optional().or(z.literal('')),
    neck: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    chest: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    shoulders: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
    hip: z.coerce.number().positive("Medida inválida").optional().or(z.literal('')),
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

const dietTypes = [
    { id: 'weight_loss', name: 'Pérdida de Peso' },
    { id: 'weight_gain', name: 'Aumento de Peso' },
    { id: 'vegan', name: 'Vegana' },
];

export default function ManagerUnifitAthleteProfilePage() {
    const { toast } = useToast();
    const params = useParams();
    const { profile: currentUserProfile, isUserLoading, firestore } = useUser();
    const memberId = params.id as string;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(null);
    
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !currentUserProfile) return null;
        return doc(firestore, 'users', memberId);
    }, [firestore, memberId, currentUserProfile]);
    const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

    const unifitProfileDocRef = useMemoFirebase(() => {
        if (!firestore || !currentUserProfile) return null;
        return doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`, memberId);
    }, [firestore, memberId, currentUserProfile]);
    const { data: unifitProfile, isLoading: profileLoading } = useDoc(unifitProfileDocRef);

    const measurementsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUserProfile) return null;
        return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${memberId}/measurements`), orderBy('date', 'desc'))
    }, [firestore, memberId, currentUserProfile]);
    const { data: measurements, isLoading: measurementsLoading } = useCollection(measurementsQuery);
    
    const coachesQuery = useMemoFirebase(() => {
        if (!firestore || !currentUserProfile) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"))
    }, [firestore, currentUserProfile]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    const form = useForm<MeasurementFormValues>({
        resolver: zodResolver(measurementSchema),
        defaultValues: { level: '', weight: '', height: '', bodyFatPercentage: '', neck: '', chest: '', shoulders: '', hip: '', armRight: '', armLeft: '', legRight: '', legLeft: '', back: '', waist: '', calfRight: '', calfLeft: '' },
    });

    useEffect(() => {
        const latest = measurements && measurements.length > 0 ? measurements[0] : {};
        form.reset({
            level: unifitProfile?.level || '',
            weight: latest.weight || '', height: latest.height || '', bodyFatPercentage: latest.bodyFatPercentage || '',
            neck: latest.neck || '',
            chest: latest.chest || '', shoulders: latest.shoulders || '', hip: latest.hip || '',
            armRight: latest.armRight || '', armLeft: latest.armLeft || '',
            legRight: latest.legRight || '', legLeft: latest.legLeft || '', back: latest.back || '', waist: latest.waist || '',
            calfRight: latest.calfRight || '', calfLeft: latest.calfLeft || '',
        });
    }, [measurements, unifitProfile, form]);

    const onAddMeasurement = (data: MeasurementFormValues) => {
        if (!firestore || !unifitProfileDocRef || !userData) return;
        
        const { level, ...measurementData } = data;
        
        // Calculate health metrics automatically
        const bmi = calculateBmi(data.weight as number, data.height as number);
        const bfp = calculateBodyFatPercentage(
            userData.gender as any,
            data.height as number,
            data.waist as number,
            data.neck as number,
            data.hip as number
        );

        // Save level to the main unifit member doc
        updateDocumentNonBlocking(unifitProfileDocRef, { level: level || null });
        
        const measurementsCollection = collection(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${memberId}/measurements`);
        const payload = {
            ...measurementData,
            bmi,
            bodyFatPercentage: bfp || data.bodyFatPercentage || null,
            date: serverTimestamp()
        };
        addDocumentNonBlocking(measurementsCollection, payload);
        toast({ title: "¡Datos Guardados!", description: "El nivel y el nuevo registro de medidas se han guardado con cálculos automáticos." });
    };

    const handleAssignCoach = (coachId: string) => {
        if (!unifitProfileDocRef) return;
        updateDocumentNonBlocking(unifitProfileDocRef, { coachId });
        toast({ title: "Entrenador Asignado" });
    };
    
    const handleAssignDiet = (dietType: string) => {
        if (!unifitProfileDocRef) return;
        updateDocumentNonBlocking(unifitProfileDocRef, { assignedDietType: dietType });
        toast({ title: "Dieta Asignada" });
    };

    const handleDeleteMeasurement = () => {
        if (!measurementToDelete || !firestore || !memberId) return;
        const measurementRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers/${memberId}/measurements`, measurementToDelete);
        deleteDocumentNonBlocking(measurementRef);
        toast({ title: "Medición Eliminada" });
        setIsDeleteDialogOpen(false);
        setMeasurementToDelete(null);
    };

    const isLoading = isUserLoading || userLoading || profileLoading || measurementsLoading || coachesLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const assignedCoach = coaches?.find(c => c.id === unifitProfile?.coachId);
    const latestMeasurement = measurements && measurements.length > 0 ? measurements[0] : null;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Perfil UNIFIT: {userData?.firstName} {userData?.lastName}</CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                        <CardDescription>
                            Entrenador: {assignedCoach ? `${assignedCoach.firstName} ${assignedCoach.lastName}` : 'Ninguno'}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2">
                            <Select onValueChange={handleAssignDiet} value={unifitProfile?.assignedDietType || ''}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Asignar Dieta..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {dietTypes?.map((diet) => (
                                        <SelectItem key={diet.id} value={diet.id}>{diet.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleAssignCoach} value={unifitProfile?.coachId || ''}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Cambiar Entrenador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {coaches?.map((coach) => (
                                        <SelectItem key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {latestMeasurement && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div className="p-3 bg-secondary/50 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase">IMC Actual</p>
                                <p className="text-xl font-bold">{latestMeasurement.bmi || '-'}</p>
                            </div>
                            <div className="p-3 bg-secondary/50 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase">% Grasa Corporal</p>
                                <p className="text-xl font-bold">{latestMeasurement.bodyFatPercentage ? `${latestMeasurement.bodyFatPercentage}%` : '-'}</p>
                            </div>
                            <div className="p-3 bg-secondary/50 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase">Nivel</p>
                                <p className="text-xl font-bold">{unifitProfile?.level || '-'}</p>
                            </div>
                            <div className="p-3 bg-secondary/50 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase">Peso</p>
                                <p className="text-xl font-bold">{latestMeasurement.weight ? `${latestMeasurement.weight}kg` : '-'}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Activity/> Registrar Nivel y Medidas</CardTitle>
                    <CardDescription>Añade un nuevo registro. El IMC y el % de grasa se calcularán automáticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddMeasurement)} className="space-y-8">
                                <FormField control={form.control} name="level" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nivel de Habilidad</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value || '')}>
                                        <FormControl><SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Asignar Nivel (1-12)" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {Array.from({length: 12}, (_, i) => i + 1).map(level => (
                                                <SelectItem key={level} value={String(level)}>{level}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Separator/>
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                    <legend className="-ml-1 px-1 text-base font-medium">Medidas para Cálculos (Requeridas para IMC/% Grasa)</legend>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                    <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Estatura (cm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="waist" render={({ field }) => (<FormItem><FormLabel>Cintura (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="neck" render={({ field }) => (<FormItem><FormLabel>Cuello (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </fieldset>
                            
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                    <legend className="-ml-1 px-1 text-base font-medium">Otras Medidas Corporales (cm)</legend>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                                    <FormField control={form.control} name="shoulders" render={({ field }) => (<FormItem><FormLabel>Hombros</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="chest" render={({ field }) => (<FormItem><FormLabel>Pecho</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="hip" render={({ field }) => (<FormItem><FormLabel>Cadera</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="armRight" render={({ field }) => (<FormItem><FormLabel>B. Der.</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="legRight" render={({ field }) => (<FormItem><FormLabel>P. Der.</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </fieldset>

                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2" />}
                                Guardar Registro y Actualizar Nivel
                            </Button>
                        </form>
                    </Form>
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
                                <TableHead>IMC</TableHead>
                                <TableHead>% Grasa</TableHead>
                                <TableHead>Cintura</TableHead>
                                <TableHead className="text-right">Borrar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {measurements?.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.date ? format(m.date.toDate(), "d MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
                                    <TableCell>{m.weight ? `${m.weight} kg` : '-'}</TableCell>
                                    <TableCell>{m.bmi || '-'}</TableCell>
                                    <TableCell>{m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '-'}</TableCell>
                                    <TableCell>{m.waist ? `${m.waist} cm` : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setMeasurementToDelete(m.id); setIsDeleteDialogOpen(true); }}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMeasurement} className="bg-destructive">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
