import React, { useEffect } from 'react';
import { User } from '../types';

interface OneSignalProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ user, children }) => {
  useEffect(() => {
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    if (user?.id) {
      // @ts-ignore
      window.OneSignalDeferred.push(async function(OneSignal) {
        if (OneSignal?.login) {
          await OneSignal.login(user.id);
        }
      });
    } else {
      // @ts-ignore
      window.OneSignalDeferred.push(async function(OneSignal) {
        if (OneSignal?.logout) {
          await OneSignal.logout();
        }
      });
    }
  }, [user?.id]);

  return <>{children}</>;
};
