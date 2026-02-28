
import React, { useEffect, useMemo, useState } from 'react';
import { useVencimentos } from '../hooks/useVencimentos';
import { supabase } from '../services/supabase';
import { Page, User } from '../types';
import Lembretes from './Lembretes';


interface DashboardProps {
  user: User;
  setCurrentPage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setCurrentPage }) => {
  const { documentos, updateVencimentoStatus } = useVencimentos();
  const [stats, setStats] = useState({
    ocupacao: '0%',
    vistorias: '0',
    ocorrencias: '0',
    urgentes: '0'
  });

  const fetchStats = async () => {
    try {
      // 1. Empresas (Contagem de empresas homologadas)
      const { count: empresasCount } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true });

      if (empresasCount !== null) {
        setStats(prev => ({ ...prev, ocupacao: empresasCount.toString() }));
      }

      // 2. Agendamentos (Contagem de agendamentos pendentes/confirmados)
      const { count: agendamentosCount } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Cancelado');

      if (agendamentosCount !== null) {
        setStats(prev => ({ ...prev, ocorrencias: agendamentosCount.toString() }));
      }

      // 3. Vistorias Pendentes
      const { count: vistoriasCount } = await supabase
        .from('vistorias')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Concluído');

      if (vistoriasCount !== null) {
        setStats(prev => ({ ...prev, vistorias: vistoriasCount.toString() }));
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const criticalDocs = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return documentos.filter(doc => {
      if (doc.status === 'Feito' || doc.visto) return false;
      const venc = new Date(doc.dataVencimento);
      const diffTime = venc.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    });
  }, [documentos]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {criticalDocs.length > 0 && (
        <div className="bg-red-500 dark:bg-red-600 rounded-2xl p-4 md:p-6 shadow-2xl shadow-red-500/20 border-2 border-white/20 animate-in slide-in-from-top duration-500">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 text-white">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="size-10 md:size-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl md:text-4xl font-black">priority_high</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-xl font-black uppercase tracking-tight">Vencimento em Prazo Crítico!</h3>
                <p className="text-xs md:text-sm font-bold opacity-90 leading-tight md:leading-normal">
                  {criticalDocs.length === 1
                    ? `O documento "${criticalDocs[0].titulo}" está na fase crítica de 5 dias. Atualize o status.`
                    : `Você tem ${criticalDocs.length} documentos em fase crítica (menos de 5 dias).`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3 shrink-0 w-full md:w-auto">
              {criticalDocs.length === 1 ? (
                <>
                  <button
                    onClick={() => updateVencimentoStatus(criticalDocs[0].id, 'Feito', true)}
                    className="flex-1 md:flex-none justify-center px-4 py-2.5 md:px-6 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base md:text-lg">check_circle</span>
                    Marcar como Feito
                  </button>
                  <button
                    onClick={() => updateVencimentoStatus(criticalDocs[0].id, 'Em Andamento', true)}
                    className="flex-1 md:flex-none justify-center px-4 py-2.5 md:px-6 md:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    Marcar como Ciente
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    criticalDocs.forEach(doc => updateVencimentoStatus(doc.id, 'Em Andamento', true));
                  }}
                  className="w-full md:w-auto px-4 py-2.5 md:px-6 md:py-3 bg-white text-red-600 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl"
                >
                  Resolver Pendências
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Empresas', value: stats.ocupacao, change: 'Cadastradas', color: 'text-emerald-500', icon: 'business', bg: 'bg-emerald-500/10', target: 'empresas' as Page },
          { label: 'Vistorias', value: stats.vistorias, change: 'Pendentes', color: 'text-amber-500', icon: 'assignment_turned_in', bg: 'bg-amber-500/10', target: 'vistorias' as Page },
          { label: 'Documentos com Urgência', value: criticalDocs.length.toString(), change: '< 5 Dias', color: 'text-red-500', icon: 'notification_important', bg: 'bg-red-500/10', target: 'vencimentos' as Page },
          { label: 'Agendamentos', value: stats.ocorrencias, change: `Atuais`, color: 'text-blue-500', icon: 'calendar_month', bg: 'bg-blue-500/10', target: 'agendamentos' as Page },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => setCurrentPage(card.target)}
            className="bg-white dark:bg-[#1d222a] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${card.color} bg-opacity-10 border border-current opacity-60`}>{card.change}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Lembretes />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
