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
  const isFetchingRef = React.useRef<string | null>(null);

  const fetchProfile = async (id: string, retryCount = 0) => {
    const MAX_RETRIES = 5;

    // Evitar buscas duplicadas para o mesmo ID ao mesmo tempo
    if (isFetchingRef.current === id && retryCount === 0 && user) {
      setLoading(false);
      return;
    }
    
    isFetchingRef.current = id;

    try {
      console.log(`🔍 [AUTH] Carregando perfil: ${id} (Tentativa ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('❌ [AUTH] Erro no Supabase:', error);
        throw error;
      }

      // Se o perfil não existe ainda, tenta o retry (Pode ser delay da Trigger)
      if (!data) {
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 500;
          console.warn(`⚠️ [AUTH] Perfil não encontrado. Nova tentativa em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchProfile(id, retryCount + 1);
        }
        throw new Error('PROFILE_NOT_FOUND');
      }

      // Mapeamento de Role Seguro
      const dbRole = (data.role || '').toLowerCase();
      let finalRole: UserRole = 'sala';
      
      if (dbRole.includes('admin')) finalRole = 'admin';
      else if (dbRole.includes('atendente') || dbRole.includes('colaborador')) finalRole = 'atendente';

      console.log('✅ [AUTH] Perfil carregado:', { role: finalRole, sala: data.sala_numero });

      setUser({
        id: data.id,
        name: data.full_name || data.name || data.email?.split('@')[0] || 'Usuário',
        email: data.email || '',
        role: finalRole,
        avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/100/100`,
        sala_numero: data.sala_numero,
        status: data.status as 'Ativo' | 'Bloqueado',
        permissions: data.permissions || {}
      });
      
    } catch (err: any) {
      console.error('❌ [AUTH] Falha crítica:', err.message || err);
      if (retryCount >= MAX_RETRIES) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // onAuthStateChange já lida com a sessão inicial (evento INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 [AUTH] Evento: ${event}`, session?.user?.email);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        isFetchingRef.current = null;
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('❌ [AUTH] Erro ao sair:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH] Iniciando signIn...');
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) throw result.error;
    
    // O onAuthStateChange cuidará de chamar o fetchProfile
    return result.data;
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
        })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile(user.id);
    } catch (err) {
      console.error('❌ [AUTH] Erro update:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      setUser, 
      logout, 
      signIn, 
      updateProfile, 
      isAuthenticated: !!user 
    }}>
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
