'use client';

import { useState, useEffect } from 'react';
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
import { User, Shield, Phone, Hospital, ClipboardCheck, CalendarHeart, Cake, Droplets, VenetianMask, FileText, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AthleteProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { user, profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const athleteDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.clubId) return null;
    return doc(firestore, `clubs/${profile.clubId}/athletes`, user.uid);
  }, [firestore, user?.uid, profile?.clubId]);

  const { data: athleteData, isLoading: isAthleteLoading, error: athleteError } = useDoc(athleteDocRef);

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
    },
  });

  const { formState, handleSubmit, control, reset } = form;

  useEffect(() => {
    if (profile || athleteData) {
      const combinedData = { ...profile, ...athleteData };
      reset({
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
      });
    }
  }, [profile, athleteData, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !profile || !firestore || !athleteDocRef) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido obtener la información del usuario para guardar."
      });
      return;
    }
    
    try {
      // 1. Update the specific athlete document
      await updateDoc(athleteDocRef, {
          birthDate: data.birthDate,
          gender: data.gender,
          bloodType: data.bloodType,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          medicalInformation: data.medicalInformation,
      });

      // 2. Update the main user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      toast({
        title: '¡Perfil Actualizado!',
        description: 'Tu información ha sido guardada correctamente.',
      });
      setIsEditing(false);

    } catch(e: any) {
        console.error("Error updating profile:", e);
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: e.message || "No se pudo guardar tu perfil. Revisa tus permisos e inténtalo de nuevo."
        })
    }
  };
  
  if (isUserLoading || isAthleteLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  const displayData = { ...profile, ...athleteData };

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

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Mi Perfil de Deportista</CardTitle>
                    <CardDescription>Consulta y actualiza tu información personal.</CardDescription>
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
                                    <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={control} name="lastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl><Input placeholder="Tu apellido" {...field} /></FormControl>
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
                             <FormField control={control} name="documentType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Documento</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <CardTitle className="flex items-center gap-2 font-headline"><CalendarHeart /> Plan de Entrenamiento Anual</CardTitle>
                <CardDescription>Focos principales para cada trimestre del año (Ejemplo).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-primary">Primer Trimestre (Ene-Mar)</h4>
                        <p className="text-muted-foreground">Fase de Acondicionamiento Físico General y técnica fundamental.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Segundo Trimestre (Abr-Jun)</h4>
                        <p className="text-muted-foreground">Desarrollo de la fuerza específica, velocidad y táctica de equipo.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Tercer Trimestre (Jul-Sep)</h4>
                        <p className="text-muted-foreground">Periodo competitivo, mantenimiento de la forma física y estrategia de partido.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Cuarto Trimestre (Oct-Dic)</h4>
                        <p className="text-muted-foreground">Transición y recuperación activa, trabajo técnico de baja intensidad.</p>
                    </div>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><ClipboardCheck /> Evaluaciones Físicas</CardTitle>
                <CardDescription>Tu historial de rendimiento físico.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Aún no tienes evaluaciones físicas registradas.</p>
            </CardContent>
        </Card>
    </div>
  );
}

    