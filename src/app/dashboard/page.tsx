'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardRedirectPage() {
  const { profile, isUserLoading, user } = useUser();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    // While services are loading, do nothing and show the spinner.
    if (isUserLoading) {
      return;
    }

    // If loading is complete and there's no authenticated user,
    // they should be at the login page.
    if (!user) {
      router.replace('/login');
      return;
    }

    // From here, we know a user is authenticated.

    // If the user's profile or role could not be loaded, this is an
    // invalid state. Log them out and redirect to login with an error.
    if (!profile || !profile.role) {
      toast({
        variant: "destructive",
        title: "Error de Perfil",
        description: "No se pudo cargar la información de tu perfil. Intenta iniciar sesión de nuevo.",
      });
      if (auth) {
        auth.signOut();
      }
      router.replace('/login');
      return;
    }

    // If the user's account is disabled by an admin.
    if (profile.disabled) {
      toast({
        variant: "destructive",
        title: "Cuenta Inhabilitada",
        description: "Tu cuenta ha sido inhabilitada por un administrador. Contacta al club.",
      });
      if (auth) {
        auth.signOut();
      }
      router.replace('/login');
      return;
    }

    // If everything is correct, redirect to the user's role-specific dashboard.
    const targetDashboard = `/dashboard/${profile.role}`;
    // Only redirect if not already there to prevent loops on hot-reload
    if (pathname !== targetDashboard) {
      router.replace(targetDashboard);
    }
    
  }, [profile, user, isUserLoading, router, auth, toast, pathname]);


  // Display a loading indicator while checking the user's role and status.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
