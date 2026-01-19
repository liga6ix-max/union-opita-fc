'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Phone, Hospital, ClipboardCheck, CalendarHeart, Cake, Droplets, VenetianMask, FileText, Loader2, DollarSign, Banknote, Landmark, Hash, Info, Trophy, CalendarIcon, ShieldAlert, CheckCircle, XCircle, Wind, ArrowUpFromLine, Zap, Footprints, Timer, Scale, Ruler, Clock, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const profileSchema = z.object({
  firstName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  lastName: z.string().min(3, { message: 'El apellido debe tener al menos 3 caracteres.' }),
  birthDate: z.string().min(1, 'La fecha de nacimiento es requerida.'),
  gender: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.'}),
  bloodType: z.string().min(1, 'El tipo de sangre es requerido.'),
  documentType: z.enum(['TI', 'CC', 'RC'], { required_error: 'El tipo de documento es requerido.'}),
  documentNumber: z.string().min(5, { message: 'El número de documento es requerido.' }),
  emergencyContactName: z.string().min(3, { message: 'El nombre del contacto es requerido.' }),
  emergencyContactPhone: z.string().min(7, { message: 'El teléfono del contacto es requerido.' }),
  medicalInformation: z.string().optional(),
  team: z.string().optional(),
});

const paymentSchema = z.object({
    paymentDate: z.string().min(1, "La fecha de pago es requerida."),
    referenceNumber: z.string().min(4, { message: "El número de referencia debe tener al menos 4 caracteres."}),
    amount: z.number(),
    month: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;
type PaymentStatus = 'Pagado' | 'Pendiente' | 'En Verificación' | 'Rechazado';
const MAIN_CLUB_ID = 'OpitaClub';
type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica';

const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación (4-7 años)',
    futbol_medida: 'Fútbol a la Medida (8-11 años)',
    periodizacion_tactica: 'Periodización Táctica (12-20 años)'
};

const createSafeKeyForCategory = (categoryName: string) => {
    if (!categoryName) return '';
    return categoryName.replace(/[\s/]/g, '-');
};


export default function AthleteProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [calculatedCoachId, setCalculatedCoachId] = useState<string | null>(null);
  const { user, profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  // Profile data hooks
  const athleteDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.clubId) return null;
    return doc(firestore, `clubs/${profile.clubId}/athletes`, user.uid);
  }, [firestore, user?.uid, profile?.clubId]);
  const { data: athleteData, isLoading: isAthleteLoading, error: athleteError } = useDoc(athleteDocRef);
  
  // Club Config data hook
  const clubConfigRef = useMemoFirebase(() => {
      if (!firestore || !profile?.clubId) return null;
      return doc(firestore, `clubs`, profile.clubId);
  }, [firestore, profile?.clubId]);
  const { data: clubConfig, isLoading: isClubConfigLoading } = useDoc(clubConfigRef);

  // Payment data hooks
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.clubId) return null;
    const paymentsCollection = collection(firestore, `clubs/${profile.clubId}/payments`);
    return query(paymentsCollection, where("athleteId", "==", user.uid));
  }, [firestore, user?.uid, profile?.clubId]);
  const { data: athletePayments, isLoading: arePaymentsLoading } = useCollection(paymentsQuery);

  const coachQuery = useMemoFirebase(() => {
    if (!firestore || !athleteData?.coachId || !profile?.clubId) return null;
    return doc(firestore, 'users', athleteData.coachId);
  }, [firestore, athleteData?.coachId, profile?.clubId]);
  const { data: coach, isLoading: isCoachLoading } = useDoc(coachQuery);

  const allMicrocyclesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId) return null;
    return collection(firestore, `clubs/${profile.clubId}/microcycles`);
  }, [firestore, profile?.clubId]);
  const { data: allMicrocycles, isLoading: cyclesLoading } = useCollection(allMicrocyclesQuery);

  const teamCycles = useMemo(() => {
    if (!allMicrocycles || !athleteData?.team) return [];
    return allMicrocycles.filter(c => c.team === athleteData.team);
  }, [allMicrocycles, athleteData?.team]);
  
  const attendanceQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid || !profile?.clubId) return null;
      // This is a broad query, but necessary without complex backend logic.
      // It gets all attendance records for the club and we filter client-side.
      return collection(firestore, `clubs/${profile.clubId}/attendance`);
  }, [firestore, user?.uid, profile?.clubId]);
  const { data: allAttendance, isLoading: attendanceLoading } = useCollection(attendanceQuery);
  
  const athleteAttendance = useMemo(() => {
      if (!allAttendance || !user?.uid) return {};
      const records: Record<string, boolean> = {}; // eventId: wasPresent
      allAttendance.forEach(record => {
          if (record.attendance && user.uid in record.attendance) {
              records[record.eventId] = record.attendance[user.uid];
          }
      });
      return records;
  }, [allAttendance, user?.uid]);


  // Profile Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', birthDate: '', gender: undefined, bloodType: '',
      documentType: undefined, documentNumber: '', emergencyContactName: '',
      emergencyContactPhone: '', medicalInformation: '', team: ''
    },
  });

  const { watch, setValue } = profileForm;
  const watchedBirthDate = watch("birthDate");

  useEffect(() => {
    if (watchedBirthDate && clubConfig?.categories && allMicrocycles) {
        try {
            const birthYear = parseISO(watchedBirthDate).getFullYear();
            const foundCategory = clubConfig.categories.find((cat: any) => birthYear >= cat.minYear && birthYear <= cat.maxYear);
            if (foundCategory) {
                const categoryName = foundCategory.name;
                setValue('team', categoryName, { shouldValidate: true });

                const cycleForTeam = allMicrocycles.find(c => c.team === categoryName);
                if (cycleForTeam && cycleForTeam.coachId) {
                    setCalculatedCoachId(cycleForTeam.coachId);
                } else {
                    setCalculatedCoachId(null);
                }
            } else {
                setValue('team', '', { shouldValidate: true });
                setCalculatedCoachId(null);
            }
        } catch(e) {
            setValue('team', '', { shouldValidate: true });
            setCalculatedCoachId(null);
        }
    }
  }, [watchedBirthDate, clubConfig, allMicrocycles, setValue]);


  // Payment Form
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


  useEffect(() => {
    if (profile || athleteData) {
      const combinedData = { ...profile, ...athleteData };
      profileForm.reset({
        firstName: combinedData.firstName || '',
        lastName: combinedData.lastName || '',
        birthDate: combinedData.birthDate ? format(parseISO(combinedData.birthDate), 'yyyy-MM-dd') : '',
        gender: combinedData.gender || undefined,
        bloodType: combinedData.bloodType || '',
        documentType: combinedData.documentType || undefined,
        documentNumber: combinedData.documentNumber || '',
        emergencyContactName: combinedData.emergencyContactName || '',
        emergencyContactPhone: combinedData.emergencyContactPhone || '',
        medicalInformation: combinedData.medicalInformation || '',
        team: combinedData.team || '',
      });
    }
  }, [profile, athleteData, profileForm.reset]);

  const onProfileSubmit = (data: ProfileFormValues) => {
    if (!user || !profile || !firestore || !athleteDocRef) return;
    
    setDocumentNonBlocking(athleteDocRef, {
        birthDate: data.birthDate,
        gender: data.gender,
        bloodType: data.bloodType,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        medicalInformation: data.medicalInformation,
        team: data.team,
        coachId: calculatedCoachId,
    }, { merge: true });

    const userDocRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userDocRef, { firstName: data.firstName, lastName: data.lastName });
    
    toast({ title: '¡Perfil Actualizado!', description: data.team ? `Tu información ha sido guardada y se te ha asignado a la categoría ${data.team}.` : 'Tu información ha sido guardada correctamente.' });
    setIsEditing(false);
  };

  const onPaymentSubmit = (data: PaymentFormValues, paymentId: string) => {
    if (!firestore || !profile?.clubId) return;

    const paymentRef = doc(firestore, `clubs/${profile.clubId}/payments`, paymentId);
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

  const isLoading = isUserLoading || isAthleteLoading || arePaymentsLoading || isCoachLoading || isClubConfigLoading || cyclesLoading || attendanceLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  const displayData = { ...profile, ...athleteData };

  if (!displayData) {
    return <div>No se encontró el perfil del deportista.</div>;
  }
  
  const hasPendingPayment = athletePayments?.some(p => p.status === 'Pendiente');
  const monthlyFee = (clubConfig?.monthlyFees as Record<string, number>)?.[athleteData?.team] || 0;

  const getAge = (birthDateString: string) => {
    if (!birthDateString || !isValid(parseISO(birthDateString))) return null;
    const birthDate = parseISO(birthDateString);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) return age - 1;
    return age;
  };
  const age = displayData.birthDate ? getAge(displayData.birthDate) : null;
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const statusBadgeVariant: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
    'Pagado': 'default', 'Pendiente': 'destructive', 'En Verificación': 'secondary', 'Rechazado': 'outline',
  };

  const hasPhysicalData = athleteData?.weight || athleteData?.height || athleteData?.vo2max || athleteData?.jumpHeight || athleteData?.speedTest30mTime || athleteData?.ankleFlexibility || athleteData?.enduranceTest8kmTime;
  const speed = athleteData?.speedTest30mTime ? (30 / athleteData.speedTest30mTime).toFixed(2) : null;

  const schedule = clubConfig?.trainingSchedules?.[createSafeKeyForCategory(athleteData?.team)];


  return (
    <div className="space-y-8">
        {hasPendingPayment && (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Notificación Importante</AlertTitle>
                <AlertDescription>Tienes una cuota de pago pendiente. Por favor, realiza el pago para poder continuar con los entrenamientos.</AlertDescription>
            </Alert>
        )}

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Mi Perfil de Deportista</CardTitle>
                    <CardDescription>Consulta y actualiza tu información personal y de pagos.</CardDescription>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'default'}>
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={profileForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormField control={profileForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Tu apellido" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={profileForm.control} name="birthDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Nacimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormField control={profileForm.control} name="team" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipo / Categoría (Automático)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Se asignará con la fecha de nacimiento" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {clubConfig?.categories?.map((cat: any) => (
                                                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={profileForm.control} name="documentType" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent><SelectItem value="TI">Tarjeta de Identidad</SelectItem><SelectItem value="CC">Cédula de Ciudadanía</SelectItem><SelectItem value="RC">Registro Civil</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={profileForm.control} name="documentNumber" render={({ field }) => (<FormItem><FormLabel>Número de Documento</FormLabel><FormControl><Input placeholder="123456789" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormField control={profileForm.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                             <FormField control={profileForm.control} name="bloodType" render={({ field }) => (<FormItem><FormLabel>Tipo de Sangre</FormLabel><FormControl><Input placeholder="Ej: O+" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={profileForm.control} name="emergencyContactName" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto Emergencia</FormLabel><FormControl><Input placeholder="Ej: Maria Pérez" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormField control={profileForm.control} name="emergencyContactPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Contacto Emergencia</FormLabel><FormControl><Input placeholder="Ej: 3101234567" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={profileForm.control} name="medicalInformation" render={({ field }) => (<FormItem><FormLabel>Información Médica Relevante</FormLabel><FormControl><Textarea placeholder="Alergias, condiciones médicas importantes, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}</Button>
                    </form>
                </Form>
                ) : (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Nombre Completo</p><p className="font-medium">{displayData.firstName} {displayData.lastName}</p></div></div>
                        <div className="flex items-center gap-4"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Equipo</p><p className="font-medium">{athleteData?.team || 'No asignado'}</p></div></div>
                        <div className="flex items-center gap-4"><Cake className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Fecha de Nacimiento</p><p className="font-medium">{displayData.birthDate ? `${format(parseISO(displayData.birthDate), "d 'de' MMMM, yyyy", { locale: es })} (${age} años)` : 'No especificada'}</p></div></div>
                        <div className="flex items-center gap-4"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Documento</p><p className="font-medium">{displayData.documentType} {displayData.documentNumber || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><VenetianMask className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Género</p><p className="font-medium">{displayData.gender || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><Droplets className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Tipo de Sangre</p><p className="font-medium">{displayData.bloodType || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Contacto de Emergencia</p><p className="font-medium">{displayData.emergencyContactName && displayData.emergencyContactPhone ? `${displayData.emergencyContactName} - ${displayData.emergencyContactPhone}` : 'No especificado'}</p></div></div>
                        <div className="flex items-start gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Hospital className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Información Médica</p><p className="font-medium">{displayData.medicalInformation || 'No especificada'}</p></div></div>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><CalendarHeart/> Plan de Entrenamiento y Asistencia</CardTitle>
                <CardDescription>
                     Tu plan de entrenamiento asignado. Entrenador a cargo: <span className="font-bold">{coach?.firstName || 'No asignado'} {coach?.lastName || ''}</span>
                     {schedule && Array.isArray(schedule) && schedule.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {schedule.map((session, index) => (
                                <div key={index} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5 font-semibold"><CalendarIcon className="h-4 w-4"/> {session.day}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {session.time}</span>
                                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {session.location}</span>
                                </div>
                            ))}
                        </div>
                     )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!teamCycles || teamCycles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aún no tienes un plan de entrenamiento asignado.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                    {teamCycles.map((cycle) => (
                        <Card key={cycle.id}>
                        <AccordionItem value={`cycle-${cycle.id}`} className="border-b-0">
                            <AccordionTrigger className="p-6 hover:no-underline">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4 text-left">
                                <div>
                                    <h4 className="font-bold text-lg">{cycle.week} - {cycle.team}</h4>
                                    <Badge variant="secondary" className="mt-2">{methodologyLabels[cycle.methodology as MicrocycleMethodology]}</Badge>
                                </div>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold">Objetivo Principal</h5>
                                    <p className="text-muted-foreground">{cycle.mainObjective}</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-semibold">Sesiones y Asistencia</h5>
                                    {cycle.sessions.map((session: any, index: number) => {
                                        const eventIdForSession = `${cycle.id}_${session.day}`;
                                        const attendanceStatus = athleteAttendance[eventIdForSession];
                                        
                                        return (
                                            <div key={index} className="border-l-2 border-primary pl-4 py-2">
                                                <div className="flex justify-between items-center">
                                                     <p className="font-bold">{session.day} - {session.focus} ({session.duration} min)</p>
                                                     {attendanceStatus === true && <Badge variant="default"><CheckCircle className="h-4 w-4 mr-1"/> Asistió</Badge>}
                                                     {attendanceStatus === false && <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1"/>No Asistió</Badge>}
                                                     {attendanceStatus === undefined && <Badge variant="outline">Pendiente</Badge>}
                                                </div>
                                                <p className="text-muted-foreground whitespace-pre-wrap mt-1">{session.activities}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            </AccordionContent>
                        </AccordionItem>
                        </Card>
                    ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Historial de Pagos</CardTitle>
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
                        {athletePayments?.map(payment => (
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
                                                            <FormField control={paymentForm.control} name="month" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Mes a Pagar</FormLabel>
                                                                    <FormControl><Input {...field} readOnly disabled /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                             <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Valor (COP)</FormLabel>
                                                                    <FormControl><Input type="text" value={formatCurrency(field.value)} readOnly disabled /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField control={paymentForm.control} name="paymentDate" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Fecha de la Transferencia</FormLabel>
                                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
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
                 {(!athletePayments || athletePayments.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No tienes pagos registrados.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><ClipboardCheck /> Evaluaciones Físicas</CardTitle>
            </CardHeader>
            <CardContent>
                {hasPhysicalData ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4"><Scale className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Peso</p><p className="font-medium">{athleteData.weight ? `${athleteData.weight} kg` : 'No registrado'}</p></div></div>
                        <div className="flex items-center gap-4"><Ruler className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Estatura</p><p className="font-medium">{athleteData.height ? `${athleteData.height} cm` : 'No registrada'}</p></div></div>
                        <div className="flex items-center gap-4"><Wind className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Consumo Máx. Oxígeno</p><p className="font-medium">{athleteData.vo2max ? `Nivel ${athleteData.vo2max}` : 'No registrado'}</p></div></div>
                        <div className="flex items-center gap-4"><Zap className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Velocidad (30m)</p><p className="font-medium">{speed ? `${speed} m/s` : 'No registrado'}</p></div></div>
                        <div className="flex items-center gap-4"><Timer className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Resistencia (8km)</p><p className="font-medium">{athleteData.enduranceTest8kmTime || 'No registrado'}</p></div></div>
                        <div className="flex items-center gap-4"><ArrowUpFromLine className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Salto Vertical</p><p className="font-medium">{athleteData.jumpHeight ? `${athleteData.jumpHeight} cm` : 'No registrado'}</p></div></div>
                        <div className="flex items-center gap-4"><Footprints className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Flexibilidad de Tobillo</p><p className="font-medium">{athleteData.ankleFlexibility ? `${athleteData.ankleFlexibility} cm` : 'No registrado'}</p></div></div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Aún no tienes evaluaciones físicas registradas.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
