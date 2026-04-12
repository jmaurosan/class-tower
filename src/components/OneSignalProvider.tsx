import React, { useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface OneSignalProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ user, children }) => {
  const { loading } = useAuth();

  useEffect(() => {
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    // Se estiver carregando o perfil, não fazemos nada (evita conflitos)
    if (loading) return;

    if (user?.id) {
      // @ts-ignore
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal?.login) {
            console.log('🔔 [ONESIGNAL] Vinculando usuário:', user.id);
            await OneSignal.login(user.id);
          }
        } catch (err) {
          console.warn('⚠️ [ONESIGNAL] Erro ao logar no OneSignal:', err);
        }
      });
    } else {
      // @ts-ignore
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal?.logout) {
            console.log('🔔 [ONESIGNAL] Deslogando usuário...');
            await OneSignal.logout();
          }
        } catch (err) {
          console.warn('⚠️ [ONESIGNAL] Erro ao deslogar no OneSignal:', err);
        }
      });
    }
  }, [user?.id]);

  return <>{children}</>;
};
