import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // In a real app, you'd get the user's role from a session
  // and redirect accordingly.
  // For now, we'll default to the manager dashboard.
  redirect('/dashboard/manager');
}
