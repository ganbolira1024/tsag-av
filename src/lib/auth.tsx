// Нэвтрэлтийн төлвийг (session + profile) бүх дэлгэцэд Context-оор түгээнэ
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    // 1) Апп нээгдэхэд SecureStore-д хадгалсан session байгаа эсэхийг шалгана
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    // 2) Нэвтрэх / гарах бүрт session шинэчлэгдэнэ
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // setTimeout: callback дотроос шууд supabase дуудвал гацдаг алдаанаас сэргийлнэ
      setTimeout(() => {
        if (newSession) loadProfile(newSession.user.id);
        else setProfile(null);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    refreshProfile: async () => {
      if (session) await loadProfile(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Дэлгэц бүр: const { session, isAdmin } = useAuth();
export const useAuth = () => useContext(AuthContext);
