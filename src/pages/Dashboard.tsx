
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
  const [stats, setStats] = useState({ ocupacao: '0%', vistorias: '0', agendamentos: '0', dbSize: '...', salas: '0' });

  const fetchStats = async () => {
    try {
      // Calcular taxa de ocupação baseado nas salas
      const { data: salasData, error: salasError } = await supabase.from('salas').select('nome');
      if (!salasError && salasData) {
        const totalSalas = 100; // Padrão do prédio (16 andares * 6 + 2 * 3 + 2 térreo = 96 + 6 + 2 = 104, mas arredondando ou usando total real se preferir)
        // Vamos contar quantas salas tem nome preenchido
        const salasOcupadas = salasData.filter(s => s.nome && s.nome.trim() !== '').length;
        const porcentagem = totalSalas > 0 ? Math.round((salasOcupadas / totalSalas) * 100) : 0;
        setStats(prev => ({ ...prev, ocupacao: `${porcentagem}%` }));
      }

      const { count: agendamentosCount } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true }).neq('status', 'Cancelado');
      if (agendamentosCount !== null) setStats(prev => ({ ...prev, agendamentos: agendamentosCount.toString() }));

      const { count: vistoriasCount } = await supabase.from('vistorias').select('*', { count: 'exact', head: true }).neq('status', 'Concluído');
      if (vistoriasCount !== null) setStats(prev => ({ ...prev, vistorias: vistoriasCount.toString() }));

      // Buscar tamanho do banco (apenas admin)
      if (user.role === 'admin') {
        const { data: dbSize, error: dbError } = await supabase.rpc('get_database_size');
        if (!dbError && dbSize) {
          setStats(prev => ({ ...prev, dbSize }));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const criticalDocs = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return documentos.filter(doc => {
      if (doc.status === 'Feito' || doc.visto) return false;
      const diffDays = Math.ceil((new Date(doc.dataVencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    });
  }, [documentos]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const metricCards = [
    { label: 'Empresas', value: stats.ocupacao, icon: 'meeting_room', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', target: 'salas' as Page },
    { label: 'Vistorias', value: stats.vistorias, icon: 'assignment_turned_in', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', target: 'vistorias' as Page },
    { label: 'Documentos', value: criticalDocs.length.toString(), icon: 'notification_important', color: 'text-red-400', bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', target: 'vencimentos' as Page },
    { label: 'Agendamentos', value: stats.agendamentos, icon: 'calendar_month', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', target: 'agendamentos' as Page },
  ];

  const quickActions = [
    { label: 'Nova Vistoria', icon: 'add_task', color: 'bg-amber-500', target: 'vistorias' as Page },
    { label: 'Ver Documentos', icon: 'folder_open', color: 'bg-blue-500', target: 'vencimentos' as Page },
    { label: 'Agendamentos', icon: 'event', color: 'bg-purple-500', target: 'agendamentos' as Page },
    { label: 'Gerenciar Salas', icon: 'meeting_room', color: 'bg-emerald-500', target: 'salas' as Page },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">

      {/* Banner crítico */}
      {criticalDocs.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 md:p-5 shadow-2xl shadow-red-500/30 border border-white/20 animate-in slide-in-from-top duration-500">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl font-black">priority_high</span>
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black uppercase tracking-tight">Vencimento em Prazo Crítico!</h3>
                <p className="text-xs md:text-sm opacity-90 leading-tight">
                  {criticalDocs.length === 1
                    ? `O documento "${criticalDocs[0].titulo}" vence em menos de 5 dias.`
                    : `${criticalDocs.length} documentos em prazo crítico (menos de 5 dias).`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full lg:w-auto">
              {criticalDocs.length === 1 ? (
                <>
                  <button onClick={() => updateVencimentoStatus(criticalDocs[0].id, 'Feito', true)} className="flex-1 lg:flex-none px-4 py-2 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-base">check_circle</span> Marcar Feito
                  </button>
                  <button onClick={() => updateVencimentoStatus(criticalDocs[0].id, 'Em Andamento', true)} className="flex-1 lg:flex-none px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95">
                    Ciente
                  </button>
                </>
              ) : (
                <button onClick={() => criticalDocs.forEach(d => updateVencimentoStatus(d.id, 'Em Andamento', true))} className="w-full lg:w-auto px-5 py-2 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all">
                  Resolver Pendências
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Boas-vindas */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#1a1f28] dark:to-[#13171e] rounded-2xl p-5 md:p-8 border border-slate-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <div className="absolute -top-10 -right-10 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{greeting()}, 👋</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user.name}</h2>
            <p className="text-slate-400 text-sm mt-1 capitalize">{user.role === 'admin' ? 'Administrador do Sistema' : user.role}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Hoje</p>
              <p className="text-white font-bold text-sm">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            </div>
            <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">calendar_today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div
            key={i}
            onClick={() => setCurrentPage(card.target)}
            className={`bg-gradient-to-br ${card.bg} backdrop-blur border ${card.border} rounded-2xl p-5 cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all duration-200 group`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`size-10 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors text-base">arrow_forward</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Layout principal: Lembretes + Ações Rápidas */}
      <div className={`grid grid-cols-1 ${user.role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-4xl mx-auto w-full'} gap-6`}>
        {/* Lembretes ocupa 2/3 */}
        {user.role === 'admin' && (
          <div className="lg:col-span-2">
            <Lembretes />
          </div>
        )}

        {/* Ações Rápidas ocupa 1/3 (ou total se não for admin) */}
        <div className="space-y-4 w-full">
          <div className="bg-white dark:bg-[#1d222a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">bolt</span>
              Acesso Rápido
            </h4>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(action.target)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-left"
                >
                  <div className={`size-9 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-white text-base">{action.icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-base ml-auto">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini card de status do sistema */}
          <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sistema Online</span>
              </div>
              {user.role === 'admin' && (
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-white/10 dark:bg-slate-800 px-2 py-0.5 rounded">
                  DB: {stats.dbSize}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Todos os serviços operando normalmente. 
              {user.role === 'admin' && ` Seu banco de dados Supabase está consumindo ${stats.dbSize} de armazenamento.`}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
