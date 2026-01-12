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
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';

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
  const { auth, firestore } = useFirebase();

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
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Los servicios de Firebase no están disponibles.",
        });
        setIsLoading(false);
        return;
    }

    try {
        // Check if any user exists to determine if this is the first registration
        const usersCollectionRef = collection(firestore, 'users');
        const q = query(usersCollectionRef, limit(1));
        const existingUsersSnapshot = await getDocs(q);
        const isFirstUser = existingUsersSnapshot.empty;

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: data.name });

        // Determine role
        const role = isFirstUser ? 'manager' : 'pending';
        const clubId = isFirstUser ? 'club-opita-fc' : ''; // Assign a default clubId for the first manager

        // Create user profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            id: user.uid,
            firstName: data.name.split(' ')[0] || '',
            lastName: data.name.split(' ').slice(1).join(' ') || '',
            email: user.email,
            clubId: clubId,
            role: role,
        });

        // Create the club if it's the first user
        if (isFirstUser) {
            const clubDocRef = doc(firestore, 'clubs', clubId);
            await setDoc(clubDocRef, {
                id: clubId,
                name: "Unión Opita FC",
                nit: "901.943.142-2"
            });
        }


        setIsLoading(false);

        if (isFirstUser) {
            toast({
                title: '¡Administrador Creado!',
                description: 'Te has registrado como el primer administrador. Ahora puedes iniciar sesión.',
            });
        } else {
            toast({
                title: '¡Registro Enviado!',
                description: 'Tu solicitud ha sido enviada. Un administrador la revisará y asignará tu rol pronto.',
            });
        }
        
        router.push('/login');

    } catch (error: any) {
        console.error("Error al registrar:", error);
        setIsLoading(false);
        toast({
            variant: "destructive",
            title: "Error en el registro",
            description: error.code === 'auth/email-already-in-use' ? 'Este correo ya está registrado.' : (error.message || "No se pudo completar el registro."),
        });
    }
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
