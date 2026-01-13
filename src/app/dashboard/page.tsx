'use client';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardRedirectPage() {
  const { profile, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading) {
      if (profile?.disabled) {
        // If user is disabled, sign them out and show a message
        if (auth) auth.signOut();
        toast({
          variant: "destructive",
          title: "Cuenta Inhabilitada",
          description: "Tu cuenta ha sido inhabilitada por un administrador. Contacta al club.",
        });
        router.replace('/login');
      } else if (profile?.role) {
        // If enabled and has a role, redirect to their specific dashboard
        router.replace(`/dashboard/${profile.role}`);
      } else {
        // If there's no profile or role, but they are authenticated somehow,
        // send them to login to be safe.
        router.replace('/login');
      }
    }
  }, [profile, isUserLoading, router, auth, toast]);

  // Display a loading indicator while checking the user's role and status.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

    