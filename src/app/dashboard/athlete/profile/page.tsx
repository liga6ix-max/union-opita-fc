
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { User, Shield, Phone, Hospital, ClipboardCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const profileSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  team: z.string(),
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
      team: athlete?.team || '',
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
                    <div className="flex items-center gap-4">
                        <User className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Nombre Completo</p>
                            <p className="font-medium">{athlete.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Shield className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Equipo</p>
                            <p className="font-medium">{athlete.team}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Phone className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Contacto de Emergencia</p>
                            <p className="font-medium">{athlete.emergencyContact}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Hospital className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Información Médica</p>
                            <p className="font-medium">{athlete.medicalInfo || 'No especificada'}</p>
                        </div>
                    </div>
                </div>
                )}
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
