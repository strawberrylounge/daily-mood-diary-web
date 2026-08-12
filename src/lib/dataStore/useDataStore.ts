"use client";

import { useAuth } from "@/lib/auth/AuthProvider";

import { localStore } from "./localStore";
import { supabaseStore } from "./supabaseStore";
import type { DataStore } from "./types";

export function useDataStore(): DataStore {
  const { session } = useAuth();
  return session ? supabaseStore : localStore;
}
