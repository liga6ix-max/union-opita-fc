
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { athletes } from '@/lib/data';
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
import { User, Shield, Phone, Hospital, ClipboardCheck, CalendarHeart, Cake, Droplets, VenetianMask, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  birthDate: z.string().min(1, 'La fecha de nacimiento es requerida.'),
  gender: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.'}),
  bloodType: z.string().min(1, 'El tipo de sangre es requerido.'),
  documentType: z.enum(['TI', 'CC', 'RC'], { required_error: 'El tipo de documento es requerido.'}),
  documentNumber: z.string().min(5, { message: 'El número de documento es requerido.' }),
  emergencyContact: z.string().min(10, { message: 'El contacto de emergencia es requerido.' }),
  medicalInfo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Asumimos que el deportista con ID 1 ha iniciado sesión
const currentAthleteId = 1;
const athlete = athletes.find((a) => a.id === currentAthleteId);

export default function AthleteProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: athlete?.name || '',
      birthDate: athlete?.birthDate ? format(parseISO(athlete.birthDate), 'yyyy-MM-dd') : '',
      gender: athlete?.gender || 'Masculino',
      bloodType: athlete?.bloodType || '',
      documentType: athlete?.documentType || 'TI',
      documentNumber: athlete?.documentNumber || '',
      emergencyContact: athlete?.emergencyContact || '',
      medicalInfo: athlete?.medicalInfo || '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    console.log('Perfil actualizado:', data);
    // En una aplicación real, aquí guardarías los datos en la base de datos.
    // athletes.find(a => a.id === currentAthleteId) = {...athlete, ...data};
    toast({
      title: '¡Perfil Actualizado!',
      description: 'Tu información ha sido guardada correctamente (simulación).',
    });
    setIsEditing(false);
  };
  
  if (!athlete) {
    return <div>Deportista no encontrado.</div>;
  }

  const getAge = (birthDateString: string) => {
    const birthDate = parseISO(birthDateString);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
        return age - 1;
    }
    return age;
  };

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Tu nombre" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Nacimiento</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="documentType"
                                render={({ field }) => (
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
                            <FormField
                                control={form.control}
                                name="documentNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Documento</FormLabel>
                                    <FormControl>
                                    <Input placeholder="123456789" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
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
                             <FormField
                                control={form.control}
                                name="bloodType"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Sangre</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Ej: O+" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contacto de Emergencia</FormLabel>
                                <FormControl>
                                <Input placeholder="Ej: Maria Pérez - 3101234567" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Nombre y número de teléfono de tu contacto de emergencia.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="medicalInfo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Información Médica Relevante</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Ej: Alergia a la penicilina, asma..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Alergias, condiciones médicas importantes, etc.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit">Guardar Cambios</Button>
                    </form>
                </Form>
                ) : (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Nombre Completo</p><p className="font-medium">{athlete.name}</p></div></div>
                        <div className="flex items-center gap-4"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Equipo</p><p className="font-medium">{athlete.team}</p></div></div>
                        <div className="flex items-center gap-4"><Cake className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Fecha de Nacimiento</p><p className="font-medium">{format(parseISO(athlete.birthDate), "d 'de' MMMM, yyyy", { locale: es })} ({getAge(athlete.birthDate)} años)</p></div></div>
                        <div className="flex items-center gap-4"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Documento</p><p className="font-medium">{athlete.documentType} {athlete.documentNumber}</p></div></div>
                        <div className="flex items-center gap-4"><VenetianMask className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Género</p><p className="font-medium">{athlete.gender}</p></div></div>
                        <div className="flex items-center gap-4"><Droplets className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Tipo de Sangre</p><p className="font-medium">{athlete.bloodType}</p></div></div>
                        <div className="flex items-center gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Contacto de Emergencia</p><p className="font-medium">{athlete.emergencyContact}</p></div></div>
                        <div className="flex items-start gap-4 col-span-1 md:col-span-2 lg:col-span-3"><Hospital className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Información Médica</p><p className="font-medium">{athlete.medicalInfo || 'No especificada'}</p></div></div>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><CalendarHeart /> Plan de Entrenamiento Anual</CardTitle>
                <CardDescription>Focos principales para cada trimestre del año.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-primary">Primer Trimestre (Ene-Mar)</h4>
                        <p className="text-muted-foreground">{athlete.trainingPlan.q1}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Segundo Trimestre (Abr-Jun)</h4>
                        <p className="text-muted-foreground">{athlete.trainingPlan.q2}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Tercer Trimestre (Jul-Sep)</h4>
                        <p className="text-muted-foreground">{athlete.trainingPlan.q3}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Cuarto Trimestre (Oct-Dic)</h4>
                        <p className="text-muted-foreground">{athlete.trainingPlan.q4}</p>
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
                {athlete.physicalEvaluations.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead>Altura</TableHead>
                                <TableHead>Sprint (20m)</TableHead>
                                <TableHead>Salto Vertical</TableHead>
                                <TableHead>Resistencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athlete.physicalEvaluations.map((evalItem, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{evalItem.date}</TableCell>
                                    <TableCell>{evalItem.weight}</TableCell>
                                    <TableCell>{evalItem.height}</TableCell>
                                    <TableCell>{evalItem.sprint_20m}</TableCell>
                                    <TableCell>{evalItem.vertical_jump}</TableCell>
                                    <TableCell>{evalItem.endurance_test}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground">Aún no tienes evaluaciones físicas registradas.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    