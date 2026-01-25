
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2, Cake, Droplets, VenetianMask, FileText, Phone, Hospital, HeartPulse, Zap, Dumbbell, Turtle } from 'lucide-react';
import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const MAIN_CLUB_ID = 'OpitaClub';

const profileSchema = z.object({
  firstName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  lastName: z.string().min(3, { message: 'El apellido debe tener al menos 3 caracteres.' }),
  birthDate: z.string().optional(),
  gender: z.enum(['Masculino', 'Femenino']).optional(),
  bloodType: z.string().optional(),
  documentType: z.enum(['TI', 'CC', 'RC']).optional(),
  documentNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalInformation: z.string().optional(),
  lastPeriodDate: z.string().optional(),
  cycleLength: z.coerce.number().min(20, "El ciclo debe ser de al menos 20 días.").max(45, "El ciclo no puede ser mayor a 45 días.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;


const MenstrualCycleTracker = ({ lastPeriodDate, cycleLength }: { lastPeriodDate?: string; cycleLength?: number }) => {
    if (!lastPeriodDate || !cycleLength || !isValid(parseISO(lastPeriodDate))) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><HeartPulse /> Seguimiento del Ciclo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                        Añade la fecha de inicio de tu último período y la duración de tu ciclo en la sección "Editar Perfil" para activar esta vista y recibir recomendaciones de entrenamiento.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const today = startOfDay(new Date());
    const periodStart = startOfDay(parseISO(lastPeriodDate));
    const cycleDay = (differenceInDays(today, periodStart) % cycleLength) + 1;

    const phases = [
        { name: 'Menstrual', range: [1, 5], icon: Turtle, color: 'bg-red-400', description: 'Tu cuerpo está en un estado de baja energía. Es un buen momento para descansar o realizar entrenamientos de baja intensidad.', recommendation: 'Entrenamientos ligeros, como caminatas, yoga o estiramientos suaves. Escucha a tu cuerpo y descansa si lo necesitas.' },
        { name: 'Folicular', range: [6, 13], icon: Dumbbell, color: 'bg-blue-400', description: 'Tus niveles de energía y estrógeno están en aumento. Te sientes más fuerte y con más resistencia.', recommendation: 'Ideal para entrenamientos de fuerza y cardio moderado. Puedes empezar a aumentar la intensidad progresivamente.' },
        { name: 'Ovulatoria', range: [14, 16], icon: Zap, color: 'bg-green-400', description: 'Es tu pico de energía y fuerza. Tu cuerpo está en su máximo rendimiento, ideal para entrenamientos de alta intensidad.', recommendation: 'Aprovecha para realizar entrenamientos HIIT, levantamiento de pesas o cualquier actividad que requiera un esfuerzo máximo.' },
        { name: 'Lútea', range: [17, cycleLength], icon: Dumbbell, color: 'bg-yellow-400', description: 'Tus niveles de energía comienzan a descender. Puedes sentirte más fatigada, especialmente en los últimos días.', recommendation: 'Opta por entrenamientos de resistencia de intensidad moderada. Hacia el final de la fase, reduce la intensidad y enfócate en la recuperación.' }
    ];

    const currentPhase = phases.find(p => cycleDay >= p.range[0] && cycleDay <= p.range[1]) || phases[3];
    const progress = (cycleDay / cycleLength) * 100;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><HeartPulse /> Seguimiento del Ciclo</CardTitle>
                <CardDescription>Entiende cómo tu ciclo afecta tu entrenamiento y energía.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Día {cycleDay} de {cycleLength}</span>
                        <span className={cn("font-semibold flex items-center gap-2", `text-${currentPhase.color.replace('bg-', '')}-800 dark:text-${currentPhase.color.replace('bg-', '')}-200`)}>
                            <currentPhase.icon className="h-4 w-4" /> Fase {currentPhase.name}
                        </span>
                    </div>
                     <div className="relative h-6 w-full rounded-full bg-muted overflow-hidden">
                        <div className="flex h-full">
                            {phases.map(phase => {
                                const width = ((phase.range[1] - phase.range[0] + 1) / cycleLength) * 100;
                                return <div key={phase.name} style={{ width: `${width}%` }} className={cn(phase.color, 'opacity-30 h-full')}></div>
                            })}
                        </div>
                        <div className="absolute top-0 h-full" style={{ left: `${(cycleDay - 1) / cycleLength * 100}%` }}>
                            <div className="h-full w-1 bg-foreground rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg border">
                    <h4 className="font-semibold text-lg">{currentPhase.name} (Días {currentPhase.range[0]}-{currentPhase.range[1]})</h4>
                    <p className="text-muted-foreground mt-1">{currentPhase.description}</p>
                    <p className="mt-3 font-medium"><span className="font-bold text-primary">Recomendación de entrenamiento:</span> {currentPhase.recommendation}</p>
                </div>
            </CardContent>
        </Card>
    );
};


export default function UnifitProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { profile, user, isUserLoading, firestore } = useUser();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: undefined,
      bloodType: '',
      documentType: undefined,
      documentNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalInformation: '',
      lastPeriodDate: '',
      cycleLength: 28,
    }
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        birthDate: (profile.birthDate && isValid(parseISO(profile.birthDate))) ? format(parseISO(profile.birthDate), 'yyyy-MM-dd') : '',
        gender: profile.gender || undefined,
        bloodType: profile.bloodType || '',
        documentType: profile.documentType || undefined,
        documentNumber: profile.documentNumber || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        medicalInformation: profile.medicalInformation || '',
        lastPeriodDate: (profile.lastPeriodDate && isValid(parseISO(profile.lastPeriodDate))) ? format(parseISO(profile.lastPeriodDate), 'yyyy-MM-dd') : '',
        cycleLength: profile.cycleLength || 28,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!profile?.id || !firestore || !user?.uid) return;

    const userDocRef = doc(firestore, 'users', profile.id);
    updateDocumentNonBlocking(userDocRef, {
        firstName: data.firstName,
        lastName: data.lastName,
    });
    
    const unifitMemberDocRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/unifitMembers`, user.uid);
    const unifitPayload = {
      birthDate: data.birthDate || null,
      gender: data.gender || null,
      bloodType: data.bloodType || null,
      documentType: data.documentType || null,
      documentNumber: data.documentNumber || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      medicalInformation: data.medicalInformation || null,
      lastPeriodDate: data.lastPeriodDate || null,
      cycleLength: data.cycleLength || null,
    };
    setDocumentNonBlocking(unifitMemberDocRef, unifitPayload, { merge: true });

    toast({
        title: '¡Perfil Actualizado!',
        description: 'Tu información ha sido guardada correctamente.',
    });
    setIsEditing(false);
  };
  
  if (isUserLoading || !profile) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  const getAge = (birthDateString?: string) => {
    if (!birthDateString || !isValid(parseISO(birthDateString))) return null;
    const birthDate = parseISO(birthDateString);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) return age - 1;
    return age;
  };
  const age = getAge(profile.birthDate);

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Mi Perfil</CardTitle>
                    <CardDescription>Consulta y actualiza tu información personal.</CardDescription>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'default'}>
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl><Input placeholder="Tu apellido" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="birthDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Nacimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="documentType" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent><SelectItem value="TI">Tarjeta de Identidad</SelectItem><SelectItem value="CC">Cédula de Ciudadanía</SelectItem><SelectItem value="RC">Registro Civil</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="documentNumber" render={({ field }) => (<FormItem><FormLabel>Número de Documento</FormLabel><FormControl><Input placeholder="123456789" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="bloodType" render={({ field }) => (<FormItem><FormLabel>Tipo de Sangre</FormLabel><FormControl><Input placeholder="Ej: O+" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="emergencyContactName" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto Emergencia</FormLabel><FormControl><Input placeholder="Ej: Maria Pérez" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Contacto Emergencia</FormLabel><FormControl><Input placeholder="Ej: 3101234567" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="medicalInformation" render={({ field }) => (<FormItem><FormLabel>Información Médica Relevante</FormLabel><FormControl><Textarea placeholder="Alergias, condiciones médicas importantes, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        {form.watch('gender') === 'Femenino' && (
                             <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="-ml-1 px-1 text-lg font-medium font-headline">Datos del Ciclo</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="lastPeriodDate" render={({ field }) => (<FormItem><FormLabel>Fecha de inicio del último período</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="cycleLength" render={({ field }) => (<FormItem><FormLabel>Duración del ciclo (días)</FormLabel><FormControl><Input type="number" placeholder="Ej: 28" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                            </fieldset>
                        )}
                        <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}</Button>
                    </form>
                </Form>
                ) : (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Nombre Completo</p><p className="font-medium">{profile.firstName} {profile.lastName}</p></div></div>
                        <div className="flex items-center gap-4"><Cake className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Fecha de Nacimiento</p><p className="font-medium">{profile.birthDate ? `${format(parseISO(profile.birthDate), "d 'de' MMMM, yyyy", { locale: es })} (${age} años)` : 'No especificada'}</p></div></div>
                        <div className="flex items-center gap-4"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Documento</p><p className="font-medium">{profile.documentType} {profile.documentNumber || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><VenetianMask className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Género</p><p className="font-medium">{profile.gender || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><Droplets className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Tipo de Sangre</p><p className="font-medium">{profile.bloodType || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Contacto de Emergencia</p><p className="font-medium">{profile.emergencyContactName && profile.emergencyContactPhone ? `${profile.emergencyContactName} - ${profile.emergencyContactPhone}` : 'No especificado'}</p></div></div>
                        <div className="flex items-start gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Hospital className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Información Médica</p><p className="font-medium">{profile.medicalInformation || 'No especificada'}</p></div></div>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
        
        {profile?.gender === 'Femenino' && (
            <MenstrualCycleTracker lastPeriodDate={profile.lastPeriodDate} cycleLength={profile.cycleLength} />
        )}
    </div>
  );
}
