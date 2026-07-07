import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchProfileByAuthUser, type Profile } from "@/lib/portal-data";

export type PortalAuthState = {
  authUserId: string | null;
  profile: Profile | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function usePortalAuth(): PortalAuthState {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchProfileByAuthUser(uid);
      setProfile(p);
    } catch (err) {
      console.error(err);
      setProfile(null);
    }
  }, []);

  const reload = useCallback(async () => {
    await load(authUserId);
  }, [authUserId, load]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user?.id ?? null;
      setAuthUserId(uid);
      await load(uid);
      if (mounted) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setAuthUserId(uid);
      load(uid);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  return { authUserId, profile, loading, reload };
}
