"use client";

import { useSearchParams } from "next/navigation";

export type Role = "manager" | "coach" | "athlete";

const validRoles: Role[] = ["manager", "coach", "athlete"];

export function useRole(): Role {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  if (role && validRoles.includes(role as Role)) {
    return role as Role;
  }

  // Default to athlete if no role or invalid role is provided.
  // In a real app, this would come from a secure session.
  return "manager";
}
