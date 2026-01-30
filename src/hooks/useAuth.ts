
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          name: data.name || data.email?.split('@')[0],
          email: data.email || '',
          role: data.role as UserRole || 'sala',
          avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/100/100`,
          sala_numero: data.sala_numero
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  return { user, setUser, loading, logout, signIn, isAuthenticated: !!user };
};
