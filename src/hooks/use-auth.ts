"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/constants";

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role[];
  entity_access: string[];
  is_active: boolean;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  isLoading: boolean;
};

/**
 * Client-side auth hook. Subscribes to auth state changes and fetches
 * the user's profile. For UI display only — never use for security checks.
 * (CLAUDE.md: "Client-side role checks are for UI display only, never security.")
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial session
    async function init() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data as Profile | null);
      }

      setIsLoading(false);
    }

    init();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", newUser.id)
          .single();
        setProfile(data as Profile | null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    roles: profile?.role ?? [],
    isLoading,
  };
}
