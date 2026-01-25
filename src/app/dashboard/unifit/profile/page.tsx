
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { User, Loader2, Cake, Droplets, VenetianMask, FileText, Phone, Hospital } from 'lucide-react';
import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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
    </div>
  );
}
