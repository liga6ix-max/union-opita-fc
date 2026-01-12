
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ClubLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    console.log('Datos de registro (sin rol):', data);
    
    // Simulación de una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // En una aplicación real:
    // 1. Llamarías a Firebase Auth para crear el usuario (createUserWithEmailAndPassword).
    // 2. Guardarías el perfil del usuario en Firestore con un estado 'pending' y sin rol asignado.
    
    setIsLoading(false);
    toast({
      title: '¡Registro Enviado!',
      description: 'Tu solicitud ha sido enviada. Un administrador la revisará y asignará tu rol pronto.',
    });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <Link href="/" className="flex justify-center items-center gap-2 mb-4">
                <ClubLogo className="h-8 w-8 text-primary" />
                <span className="font-bold font-headline text-xl">Unión Opita FC</span>
            </Link>
          <CardTitle className="font-headline text-2xl">Crear una Cuenta</CardTitle>
          <CardDescription>
            Tu cuenta será activada por un administrador, quien asignará tu rol en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre y apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Crear Cuenta'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline">
              Inicia Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
