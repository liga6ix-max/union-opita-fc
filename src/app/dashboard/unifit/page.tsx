
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

/**
 * This page now acts as a redirect to the main unifit profile page.
 */
export default function UnifitDashboardRedirect() {
  const router = useRouter();
  const { isUserLoading, profile } = useUser();

  useEffect(() => {
    if (!isUserLoading && profile) {
      router.replace('/dashboard/unifit/profile');
    }
  }, [isUserLoading, profile, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
