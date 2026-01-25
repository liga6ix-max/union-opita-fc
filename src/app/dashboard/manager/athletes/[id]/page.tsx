
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams } from 'next/navigation';

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
import { User, Shield, Phone, Hospital, Cake, Droplets, VenetianMask, FileText, Loader2, Wind, ArrowUpFromLine, Zap, Footprints, Timer, Scale, Ruler, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, setDoc, query, collection, where } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Separator } from '@/components/ui/separator';

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
  team: z.string().optional(),
  coachId: z.string().optional(),
  weight: z.coerce.number().positive().optional().or(z.literal('')),
  height: z.coerce.number().positive().optional().or(z.literal('')),
  vo2max: z.coerce.number().min(1).max(30).optional().or(z.literal('')),
  jumpHeight: z.coerce.number().optional().or(z.literal('')),
  speedTest30mTime: z.coerce.number().positive().optional().or(z.literal('')),
  ankleFlexibility: z.coerce.number().optional().or(z.literal('')),
  enduranceTest8kmTime: z.string().regex(/^(\d{2}):(\d{2}):(\d{2})$/, "El formato debe ser HH:mm:ss").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerAthleteProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { profile: managerProfile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const params = useParams();
  const athleteId = params.id as string;

  const athleteDocRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return doc(firestore, `clubs/${MAIN_CLUB_ID}/athletes`, athleteId);
  }, [firestore, athleteId]);
  
  const userDocRef = useMemoFirebase(() => {
    if(!firestore || !athleteId) return null;
    return doc(firestore, 'users', athleteId);
  }, [firestore, athleteId]);
  
  const coachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
  }, [firestore]);
  
  const clubConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, `clubs`, MAIN_CLUB_ID);
  }, [firestore]);
  const { data: clubConfig, isLoading: isClubConfigLoading } = useDoc(clubConfigRef);

  const microcyclesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`);
  }, [firestore]);
  const { data: microcycles, isLoading: microcyclesLoading } = useCollection(microcyclesQuery);

  const { data: athleteData, isLoading: isAthleteLoading, error: athleteError } = useDoc(athleteDocRef);
  const { data: userData, isLoading: isUserDocLoading, error: userError } = useDoc(userDocRef);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);


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
      team: '',
      coachId: '',
      weight: '',
      height: '',
      vo2max: '',
      jumpHeight: '',
      speedTest30mTime: '',
      ankleFlexibility: '',
      enduranceTest8kmTime: '',
    },
  });

  const { formState, handleSubmit, control, reset, watch, setValue } = form;

  const watchedBirthDate = watch("birthDate");

  useEffect(() => {
    if (watchedBirthDate && clubConfig?.categories && microcycles) {
        try {
            const birthYear = parseISO(watchedBirthDate).getFullYear();
            const foundCategory = clubConfig.categories.find(cat => birthYear >= cat.minYear && birthYear <= cat.maxYear);
            if (foundCategory) {
                const categoryName = foundCategory.name;
                setValue('team', categoryName, { shouldValidate: true });

                const cycleForTeam = microcycles.find(c => c.team === categoryName);
                if (cycleForTeam && cycleForTeam.coachId) {
                    setValue('coachId', cycleForTeam.coachId, { shouldValidate: true });
                } else {
                    setValue('coachId', '', { shouldValidate: true });
                }
            } else {
                setValue('team', '', { shouldValidate: true });
                setValue('coachId', '', { shouldValidate: true });
            }
        } catch (e) {
            setValue('team', '', { shouldValidate: true });
            setValue('coachId', '', { shouldValidate: true });
        }
    }
  }, [watchedBirthDate, clubConfig, microcycles, setValue]);

  useEffect(() => {
    if (userData || athleteData) {
      const combinedData = { ...userData, ...athleteData };
      reset({
        firstName: combinedData.firstName || '',
        lastName: combinedData.lastName || '',
        birthDate: combinedData.birthDate && isValid(parseISO(combinedData.birthDate)) ? format(parseISO(combinedData.birthDate), 'yyyy-MM-dd') : '',
        gender: combinedData.gender || undefined,
        bloodType: combinedData.bloodType || '',
        documentType: combinedData.documentType || undefined,
        documentNumber: combinedData.documentNumber || '',
        emergencyContactName: combinedData.emergencyContactName || '',
        emergencyContactPhone: combinedData.emergencyContactPhone || '',
        medicalInformation: combinedData.medicalInformation || '',
        team: combinedData.team || '',
        coachId: combinedData.coachId || '',
        weight: combinedData.weight || '',
        height: combinedData.height || '',
        vo2max: combinedData.vo2max || '',
        jumpHeight: combinedData.jumpHeight || '',
        speedTest30mTime: combinedData.speedTest30mTime || '',
        ankleFlexibility: combinedData.ankleFlexibility || '',
        enduranceTest8kmTime: combinedData.enduranceTest8kmTime || '',
      });
    }
  }, [userData, athleteData, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!firestore || !athleteDocRef || !userDocRef) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido obtener la información para guardar."
      });
      return;
    }
    
    const athletePayload = {
      birthDate: data.birthDate || null,
      gender: data.gender || null,
      bloodType: data.bloodType || null,
      documentType: data.documentType || null,
      documentNumber: data.documentNumber || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      medicalInformation: data.medicalInformation || null,
      team: data.team,
      coachId: data.coachId || null,
      weight: data.weight || null,
      height: data.height || null,
      vo2max: data.vo2max || null,
      jumpHeight: data.jumpHeight || null,
      speedTest30mTime: data.speedTest30mTime || null,
      ankleFlexibility: data.ankleFlexibility || null,
      enduranceTest8kmTime: data.enduranceTest8kmTime || null,
    };

    setDocumentNonBlocking(athleteDocRef, athletePayload, { merge: true });

    updateDocumentNonBlocking(userDocRef, {
      firstName: data.firstName,
      lastName: data.lastName,
    });
    
    toast({
      title: '¡Perfil Actualizado!',
      description: `La información del deportista ha sido guardada. Categoría asignada: ${data.team}`,
    });
    setIsEditing(false);
  };
  
  if (isUserLoading || isAthleteLoading || isUserDocLoading || coachesLoading || isClubConfigLoading || microcyclesLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  const displayData = { ...userData, ...athleteData };

  if (!displayData) {
    return <div>No se encontró el perfil del deportista.</div>;
  }

  const getAge = (birthDateString: string) => {
    if (!birthDateString || !isValid(parseISO(birthDateString))) return null;
    const birthDate = parseISO(birthDateString);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
        return age - 1;
    }
    return age;
  };
  
  const age = displayData.birthDate ? getAge(displayData.birthDate) : null;
  const assignedCoach = coaches?.find(c => c.id === athleteData?.coachId);
  const speed = displayData.speedTest30mTime ? (30 / displayData.speedTest30mTime).toFixed(2) : null;

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Perfil de: {displayData.firstName} {displayData.lastName}</CardTitle>
                    <CardDescription>Consulta y actualiza la información del deportista.</CardDescription>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'default'}>
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={control} name="firstName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl><Input placeholder="Nombre del deportista" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={control} name="lastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl><Input placeholder="Apellido del deportista" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={control} name="birthDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Nacimiento</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={control} name="team" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipo / Categoría (Automático)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Se calculará con la fecha de nacimiento" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {clubConfig?.categories.map(cat => (
                                                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={control} name="coachId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Entrenador Asignado</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Asignar Entrenador" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {coaches?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={control} name="documentType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Documento</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="RC">Registro Civil</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField control={control} name="documentNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Documento</FormLabel>
                                    <FormControl><Input placeholder="123456789" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField control={control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Género</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Masculino">Masculino</SelectItem>
                                            <SelectItem value="Femenino">Femenino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField control={control} name="bloodType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Sangre</FormLabel>
                                    <FormControl><Input placeholder="Ej: O+" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={control} name="emergencyContactName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Contacto Emergencia</FormLabel>
                                    <FormControl><Input placeholder="Ej: Maria Pérez" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={control} name="emergencyContactPhone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono Contacto Emergencia</FormLabel>
                                    <FormControl><Input placeholder="Ej: 3101234567" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <FormField control={control} name="medicalInformation" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Información Médica Relevante</FormLabel>
                                <FormControl><Textarea placeholder="Alergias, condiciones médicas importantes, etc." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        <fieldset className="space-y-4 rounded-lg border p-4">
                            <legend className="-ml-1 px-1 text-lg font-medium font-headline">Evaluaciones Físicas</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="kg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Estatura (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="vo2max" render={({ field }) => (<FormItem><FormLabel>VO2 Max (Nivel 1-30)</FormLabel><FormControl><Input type="number" placeholder="Nivel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="speedTest30mTime" render={({ field }) => (<FormItem><FormLabel>Test 30m (segundos)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Segundos" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="enduranceTest8kmTime" render={({ field }) => (<FormItem><FormLabel>Test 8km (HH:mm:ss)</FormLabel><FormControl><Input placeholder="HH:mm:ss" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="jumpHeight" render={({ field }) => (<FormItem><FormLabel>Salto Vertical (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="ankleFlexibility" render={({ field }) => (<FormItem><FormLabel>Flex. Tobillo (cm)</FormLabel><FormControl><Input type="number" placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </fieldset>

                        <Button type="submit" disabled={formState.isSubmitting}>
                            {formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
                        </Button>
                    </form>
                </Form>
                ) : (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Nombre Completo</p><p className="font-medium">{displayData.firstName} {displayData.lastName}</p></div></div>
                        <div className="flex items-center gap-4"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Equipo</p><p className="font-medium">{athleteData?.team || 'No asignado'}</p></div></div>
                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Entrenador</p><p className="font-medium">{assignedCoach ? `${assignedCoach.firstName} ${assignedCoach.lastName}` : 'No asignado'}</p></div></div>
                        <div className="flex items-center gap-4"><Cake className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Fecha de Nacimiento</p><p className="font-medium">{displayData.birthDate ? `${format(parseISO(displayData.birthDate), "d 'de' MMMM, yyyy", { locale: es })} (${age} años)` : 'No especificada'}</p></div></div>
                        <div className="flex items-center gap-4"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Documento</p><p className="font-medium">{displayData.documentType} {displayData.documentNumber || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><VenetianMask className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Género</p><p className="font-medium">{displayData.gender || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4"><Droplets className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Tipo de Sangre</p><p className="font-medium">{displayData.bloodType || 'No especificado'}</p></div></div>
                        <div className="flex items-center gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Contacto de Emergencia</p><p className="font-medium">{displayData.emergencyContactName && displayData.emergencyContactPhone ? `${displayData.emergencyContactName} - ${displayData.emergencyContactPhone}` : 'No especificado'}</p></div></div>
                        <div className="flex items-start gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Hospital className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Información Médica</p><p className="font-medium">{displayData.medicalInformation || 'No especificada'}</p></div></div>
                    </div>
                     <Separator />
                    <div>
                        <h3 className="text-lg font-semibold mb-4 font-headline">Evaluaciones Físicas</h3>
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                            <div className="flex items-center gap-4"><Scale className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Peso</p><p className="font-medium">{displayData.weight ? `${displayData.weight} kg` : 'No registrado'}</p></div></div>
                            <div className="flex items-center gap-4"><Ruler className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Estatura</p><p className="font-medium">{displayData.height ? `${displayData.height} cm` : 'No registrada'}</p></div></div>
                            <div className="flex items-center gap-4"><Wind className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Consumo Máx. Oxígeno</p><p className="font-medium">{displayData.vo2max ? `Nivel ${displayData.vo2max}` : 'No registrado'}</p></div></div>
                            <div className="flex items-center gap-4"><Zap className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Velocidad (30m)</p><p className="font-medium">{speed ? `${speed} m/s` : 'No registrado'}</p></div></div>
                            <div className="flex items-center gap-4"><Timer className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Resistencia (8km)</p><p className="font-medium">{displayData.enduranceTest8kmTime || 'No registrado'}</p></div></div>
                            <div className="flex items-center gap-4"><ArrowUpFromLine className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Salto Vertical</p><p className="font-medium">{displayData.jumpHeight ? `${displayData.jumpHeight} cm` : 'No registrado'}</p></div></div>
                            <div className="flex items-center gap-4"><Footprints className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Flexibilidad de Tobillo</p><p className="font-medium">{displayData.ankleFlexibility ? `${displayData.ankleFlexibility} cm` : 'No registrado'}</p></div></div>
                        </div>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
