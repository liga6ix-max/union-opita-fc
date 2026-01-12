"use client";

import { useUser } from "@/firebase";

export type Role = "manager" | "coach" | "athlete" | "pending";

// This hook now returns the real role of the logged-in user from their profile.
export function useRole(): Role | null {
  const { profile, isUserLoading } = useUser();

  if (isUserLoading) {
    return null; // Or a 'loading' state if you prefer
  }

  return profile?.role || null;
}
