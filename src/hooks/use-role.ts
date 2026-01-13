
"use client";

import { useUser } from "@/firebase";

export type Role = "manager" | "coach" | "athlete";

// This hook now returns the real role of the logged-in user from their profile.
export function useRole(): Role | null {
  const { profile, isUserLoading } = useUser();

  if (isUserLoading) {
    return null; // Or a 'loading' state if you prefer
  }
  
  // If user is disabled, treat them as having no role to restrict access.
  if (profile?.disabled) {
    return null;
  }

  return profile?.role || null;
}
