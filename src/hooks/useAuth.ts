
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, UserRole } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect if we are in missing credentials mode
    const isConfigured = !supabase.auth.getSession.toString().includes('placeholder');

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase auth bypass: Credentials might be missing or invalid.', err);
        setLoading(false);
      });

    // Listen for auth changes
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

  const fetchProfile = async (id: string) => {
    console.log('👤 [PROFILE] Buscando perfil...', { id });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.warn('⚠️ [PROFILE] Busca de perfil cancelada (normal no recarregamento)');
          return;
        }
        console.error('❌ [PROFILE] Erro ao buscar perfil:', error);
        throw error;
      }

      if (data) {
        console.log('✅ [PROFILE] Perfil encontrado:', data);

        // Normalização de Role: Se vier algo como "Morador / Sala", converte para "sala"
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
      } else {
        console.warn('⚠️ [PROFILE] Perfil não encontrado para o usuário');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
      console.error('❌ [PROFILE] Exceção ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH] Iniciando login...', { email });
    console.log('🔐 [AUTH] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Erro no login:', error);
        throw error;
      }

      console.log('✅ [AUTH] Login bem-sucedido!', data);

      // Forçar busca do perfil imediatamente
      if (data.session?.user?.id) {
        await fetchProfile(data.session.user.id);
      }

      return data;
    } catch (err) {
      console.error('❌ [AUTH] Exceção capturada:', err);
      throw err;
    }
  };

  return { user, setUser, loading, logout, signIn, isAuthenticated: !!user };
};
