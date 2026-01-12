'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
  const { profile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (profile?.role && profile.role !== 'pending') {
        router.replace(`/dashboard/${profile.role}`);
      } else if (profile?.role === 'pending') {
        // The sidebar already handles the 'pending' state message,
        // so we can just redirect to a base dashboard page.
        router.replace('/dashboard/athlete'); 
      } else {
        // If there's no profile or role, redirect to login.
        router.replace('/login');
      }
    }
  }, [profile, isUserLoading, router]);

  // Display a loading indicator while checking the user's role.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
