'use client';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardRedirectPage() {
  const { profile, isUserLoading, user } = useUser();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Wait until loading is complete
    if (isUserLoading) {
      return;
    }

    // If there's an authenticated user...
    if (user) {
      // ...but their profile indicates they are disabled...
      if (profile?.disabled) {
        // ...sign them out, show a toast, and redirect to login.
        if (auth) {
          auth.signOut();
        }
        toast({
          variant: "destructive",
          title: "Cuenta Inhabilitada",
          description: "Tu cuenta ha sido inhabilitada por un administrador. Contacta al club.",
        });
        router.replace('/login');
      } else if (profile?.role) {
        // ...and they are enabled with a role, redirect to their specific dashboard.
        router.replace(`/dashboard/${profile.role}`);
      } else {
        // ...but they have no profile or role (e.g., during registration process),
        // it's safest to send them to login.
        router.replace('/login');
      }
    } else {
      // If there is no authenticated user, send them to login.
      router.replace('/login');
    }
  }, [profile, user, isUserLoading, router, auth, toast]);

  // Display a loading indicator while checking the user's role and status.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
