
export interface PendingSync {
  id: string;
  module: string;
  action: string;
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'classtower_offline_queue';

export const offlineService = {
  getQueue(): PendingSync[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  enqueue(module: string, action: string, payload: any) {
    const queue = this.getQueue();
    const item: PendingSync = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      module,
      action,
      payload,
      timestamp: new Date().toISOString(),
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return item;
  },

  removeFromQueue(id: string) {
    const queue = this.getQueue().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  clearQueue() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
