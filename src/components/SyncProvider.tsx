
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { avisosService } from '../services/avisosService';
import { encomendasService } from '../services/encomendasService';
import { offlineService, PendingSync } from '../services/offlineService';
import { vencimentosService } from '../services/vencimentosService';
import { vistoriasService } from '../services/vistoriasService';

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(() => {
    setPendingCount(offlineService.getQueue().length);
  }, []);

  const syncItem = async (item: PendingSync) => {
    try {
      switch (item.module) {
        case 'encomendas':
          if (item.action === 'create') await encomendasService.create(item.payload);
          if (item.action === 'updateStatus') await encomendasService.updateStatus(item.payload.id, item.payload.status, item.payload.quemRetirou);
          break;
        case 'avisos':
          if (item.action === 'create') await avisosService.create(item.payload);
          if (item.action === 'delete') await avisosService.delete(item.payload.id);
          break;
        case 'vistorias':
          if (item.action === 'create') await vistoriasService.create(item.payload);
          if (item.action === 'updateStatus') await vistoriasService.updateStatus(item.payload.id, item.payload.status);
          break;
        case 'vencimentos':
          if (item.action === 'create') await vencimentosService.create(item.payload);
          if (item.action === 'updateStatus') await vencimentosService.updateStatus(item.payload.id, item.payload.status, item.payload.visto);
          break;
      }
      offlineService.removeFromQueue(item.id);
      return true;
    } catch (error) {
      console.error(`Sync failed for ${item.module}:${item.action}`, error);
      return false;
    }
  };

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || syncing) return;

    const queue = offlineService.getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    // Process items sequentially to maintain order
    for (const item of queue) {
      const success = await syncItem(item);
      if (!success) break; // Stop if one fails to avoid state inconsistency
    }

    updatePendingCount();
    setSyncing(false);
  }, [syncing, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    // Auto-sync if online at start
    if (navigator.onLine) syncNow();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow, updatePendingCount]);

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, syncing, syncNow }}>
      {children}

      {/* Visual Indicator of Sync Status */}
      {(syncing || !isOnline || pendingCount > 0) && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end animate-in slide-in-from-bottom-5">
          {!isOnline && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/20">
              <span className="material-symbols-outlined text-sm animate-pulse">cloud_off</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Você está Offline</span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="bg-amber-500 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/20">
              <span className="material-symbols-outlined text-sm">sync_problem</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{pendingCount} Pendentes</span>
            </div>
          )}
          {syncing && (
            <div className="bg-primary text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/20">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
            </div>
          )}
        </div>
      )}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
};
