
import React from 'react';

interface NewsItem {
  version: string;
  date: string;
  title: string;
  description: string;
  icon: string;
}

const news: NewsItem[] = [
  {
    version: '2.0.0',
    date: '31/01/2026',
    title: 'Sincronização Offline & Auditoria',
    description: 'Agora o Class Tower funciona mesmo sem internet! Seus dados são salvos localmente e sincronizados automaticamente. Além disso, incluímos um rastro completo de auditoria para maior transparência.',
    icon: 'sync_saved_locally'
  },
  {
    version: '1.9.0',
    date: '30/01/2026',
    title: 'Cloud Storage & Vistorias',
    description: 'Implementamos o upload real de documentos para o Supabase Storage e um novo módulo de vistorias técnicas com suporte a fotos.',
    icon: 'cloud_upload'
  },
  {
    version: '1.8.0',
    date: '28/01/2026',
    title: 'Real-time Sync',
    description: 'Atualizações instantâneas em todo o sistema. Encomendas e avisos agora aparecem na tela sem necessidade de atualizar a página.',
    icon: 'bolt'
  }
];

interface WhatIsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatIsNewModal: React.FC<WhatIsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-[#1d222a] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">O que há de novo?</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Últimas Atualizações do Class Tower</p>
          </div>
          <button onClick={onClose} className="size-10 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center text-slate-400 transition-all active:scale-90">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {news.map((item, index) => (
            <div key={item.version} className="relative pl-12 group">
              {index !== news.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-32px] w-0.5 bg-slate-100 dark:bg-slate-800" />
              )}
              <div className="absolute left-0 top-0 size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400">v{item.version}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{item.date}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Entendido, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatIsNewModal;
