import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (id: string, retryCount = 0) => {
    const MAX_RETRIES = 3;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(id, retryCount + 1);
        }
        if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
        throw error;
      }

      if (data) {
        let normalizedRole: UserRole = 'sala';
        const rawRole = (data.role || '').toLowerCase();

        if (rawRole.includes('admin')) normalizedRole = 'admin';
        else if (rawRole.includes('atendente') || rawRole.includes('colaborador')) normalizedRole = 'atendente';
        else normalizedRole = 'sala';

        setUser({
          id: data.id,
          name: data.full_name || data.name || data.email?.split('@')[0],
          email: data.email || '',
          role: normalizedRole,
          avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/100/100`,
          sala_numero: data.sala_numero,
          status: data.status as 'Ativo' | 'Bloqueado',
          permissions: data.permissions || {}
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
      console.error('❌ [AUTH] Erro ao buscar perfil:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          avatar_url: updates.avatar,
          role: updates.role,
          sala_numero: updates.sala_numero,
          // Adicione outros campos se necessário
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recarregar o perfil para garantir consistência
      await fetchProfile(user.id);
    } catch (err) {
      console.error('❌ [AUTH] Erro ao atualizar perfil:', err);
      throw err;
    }
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session?.user?.id) {
        await fetchProfile(data.session.user.id);
      }

      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, signIn, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
