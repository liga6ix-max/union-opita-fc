
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
import { User, Shield, Phone, Hospital, Cake, Droplets, VenetianMask, FileText, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import clubConfig from '@/lib/club-config.json';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const profileSchema = z.object({
  firstName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  lastName: z.string().min(3, { message: 'El apellido debe tener al menos 3 caracteres.' }),
  birthDate: z.string().optional(),
  gender: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.'}).optional(),
  bloodType: z.string().optional(),
  documentType: z.enum(['TI', 'CC', 'RC'], { required_error: 'El tipo de documento es requerido.'}).optional(),
  documentNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalInformation: z.string().optional(),
  team: z.string().min(1, "El equipo es requerido."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ManagerAthleteProfilePage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { profile: managerProfile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const athleteId = params.id;

  const athleteDocRef = useMemoFirebase(() => {
    if (!firestore || !managerProfile?.clubId || !athleteId) return null;
    return doc(firestore, `clubs/${managerProfile.clubId}/athletes`, athleteId);
  }, [firestore, managerProfile?.clubId, athleteId]);
  
  const userDocRef = useMemoFirebase(() => {
    if(!firestore || !athleteId) return null;
    return doc(firestore, 'users', athleteId);
  }, [firestore, athleteId]);

  const { data: athleteData, isLoading: isAthleteLoading, error: athleteError } = useDoc(athleteDocRef);
  const { data: userData, isLoading: isUserDocLoading, error: userError } = useDoc(userDocRef);


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
    },
  });

  const { formState, handleSubmit, control, reset } = form;

  useEffect(() => {
    if (userData || athleteData) {
      const combinedData = { ...userData, ...athleteData };
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
        team: combinedData.team || '',
      });
    }
  }, [userData, athleteData, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!managerProfile || !firestore || !athleteDocRef || !userDocRef) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido obtener la información para guardar."
      });
      return;
    }
    
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
    }, { merge: true });

    updateDocumentNonBlocking(userDocRef, {
      firstName: data.firstName,
      lastName: data.lastName,
    });
    
    toast({
      title: '¡Perfil Actualizado!',
      description: 'La información del deportista ha sido guardada correctamente.',
    });
    setIsEditing(false);
  };
  
  if (isUserLoading || isAthleteLoading || isUserDocLoading) {
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
                            <FormField control={control} name="team" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipo / Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {clubConfig.categories.map(cat => (
                                                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
    </div>
  );
}
