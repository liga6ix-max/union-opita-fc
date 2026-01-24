'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page now acts as a redirect to the main unifit athletes page.
 */
export default function UnifitDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/unifit/athletes');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
