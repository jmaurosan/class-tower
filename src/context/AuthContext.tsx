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
    const MAX_RETRIES = 5; // Aumentado para lidar com delays de trigger

    try {
      console.log(`🔍 [AUTH] Tentando carregar perfil para ${id} (Tentativa ${retryCount + 1})...`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Usar maybeSingle para não disparar erro 406 se não existir

      if (error) {
        console.error('❌ [AUTH] Erro no Supabase ao buscar perfil:', error);
        throw error;
      }

      if (!data) {
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 500; // Exponential backoff
          console.warn(`⚠️ [AUTH] Perfil ainda não apareceu no banco. Tentando em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchProfile(id, retryCount + 1);
        }
        throw new Error('PROFILE_NOT_FOUND');
      }

      console.log('✅ [AUTH] Perfil carregado com sucesso:', { role: data.role });
      
      const rawRole = (data.role || '').toLowerCase();
      let normalizedRole: UserRole = 'sala';
      
      if (rawRole.includes('admin')) normalizedRole = 'admin';
      else if (rawRole.includes('atendente') || rawRole.includes('colaborador')) normalizedRole = 'atendente';

      setUser({
        id: data.id,
        name: data.full_name || data.name || data.email?.split('@')[0] || 'Usuário',
        email: data.email || '',
        role: normalizedRole,
        avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/100/100`,
        sala_numero: data.sala_numero,
        status: data.status as 'Ativo' | 'Bloqueado',
        permissions: data.permissions || {}
      });
      
    } catch (err: any) {
      console.error('❌ [AUTH] Falha no fetchProfile:', err.message || err);
      if (retryCount >= MAX_RETRIES) {
        setUser(null);
      }
      throw err;
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
    console.log('🔐 [AUTH] Iniciando processo de login...', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Erro no signInWithPassword:', error.message);
        throw error;
      }

      console.log('✅ [AUTH] Credenciais aceitas. Buscando informações do perfil...');
      if (data.session?.user?.id) {
        // Timeout de 10 segundos para não deixar a interface travada pra sempre
        const profilePromise = fetchProfile(data.session.user.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_PROFILE_FETCH')), 15000)
        );

        await Promise.race([profilePromise, timeoutPromise]);
        console.log('🏁 [AUTH] Fluxo de login completo.');
      }

      return data;
    } catch (err: any) {
      console.error('❌ [AUTH] Falha no fluxo de signIn:', err);
      if (err.message === 'TIMEOUT_PROFILE_FETCH') {
        throw new Error('O servidor demorou muito para responder. Tente novamente.');
      }
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
