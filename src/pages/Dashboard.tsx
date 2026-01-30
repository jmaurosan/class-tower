
import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../services/supabase';
import { DocumentoVencimento, User } from '../types';
import Lembretes from './Lembretes';

const dataChart = [
  { name: 'Semana 1', visitas: 30 },
  { name: 'Semana 2', visitas: 55 },
  { name: 'Semana 3', visitas: 42 },
  { name: 'Semana 4', visitas: 68 },
];

interface DashboardProps {
  documentos?: DocumentoVencimento[];
  onUpdateStatus?: (id: string, status: 'Feito' | 'Em Andamento', alertHandled?: boolean) => void;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ documentos = [], onUpdateStatus, user }) => {
  const [stats, setStats] = useState({
    ocupacao: '0%',
    vistorias: '12',
    ocorrencias: '0',
    urgentes: '0'
  });

  const fetchStats = async () => {
    try {
      // 1. Ocupação
      const { data: salas } = await supabase.from('salas').select('nome');
      if (salas) {
        const total = (15 * 6) + (2 * 3);
        const occupied = salas.filter(s => s.nome && s.nome.trim() !== '').length;
        setStats(prev => ({ ...prev, ocupacao: `${Math.round((occupied / total) * 100)}%` }));
      }

      // 2. Ocorrências
      const { data: ocorrencias } = await supabase.from('ocorrencias').select('categoria');
      if (ocorrencias) {
        const active = ocorrencias.length;
        const urgent = ocorrencias.filter(o => o.categoria === 'Segurança').length;
        setStats(prev => ({ ...prev, ocorrencias: active.toString(), urgentes: urgent.toString() }));
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
        <div className="bg-red-500 dark:bg-red-600 rounded-2xl p-6 shadow-2xl shadow-red-500/20 border-2 border-white/20 animate-in slide-in-from-top duration-500">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl font-black">priority_high</span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Vencimento em Prazo Crítico!</h3>
                <p className="text-sm font-bold opacity-90">
                  {criticalDocs.length === 1
                    ? `O documento "${criticalDocs[0].titulo}" está na fase crítica de 5 dias. Atualize o status.`
                    : `Você tem ${criticalDocs.length} documentos em fase crítica (menos de 5 dias).`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {criticalDocs.length === 1 ? (
                <>
                  <button
                    onClick={() => onUpdateStatus?.(criticalDocs[0].id, 'Feito', true)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Marcar como Feito
                  </button>
                  <button
                    onClick={() => onUpdateStatus?.(criticalDocs[0].id, 'Em Andamento', true)}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    Marcar como Ciente
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    criticalDocs.forEach(doc => onUpdateStatus?.(doc.id, 'Em Andamento', true));
                  }}
                  className="px-6 py-3 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl"
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
          { label: 'Taxa de Ocupação', value: stats.ocupacao, change: 'Building', color: 'text-emerald-500', icon: 'apartment', bg: 'bg-primary/10' },
          { label: 'Vistorias Pendentes', value: stats.vistorias, change: 'Sistema', color: 'text-amber-500', icon: 'warning', bg: 'bg-amber-500/10' },
          { label: 'Prazos Críticos', value: criticalDocs.length.toString(), change: '< 5 Dias', color: 'text-red-500', icon: 'gavel', bg: 'bg-red-500/10' },
          { label: 'Ocorrências Abertas', value: stats.ocorrencias, change: `${stats.urgentes} Urgentes`, color: 'text-red-500', icon: 'report_problem', bg: 'bg-red-500/10' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-[#1d222a] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${card.color} bg-opacity-10 border border-current opacity-60`}>{card.change}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#1d222a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Visitas Técnicas</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Desempenho nos últimos 30 dias</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataChart}>
                  <defs>
                    <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f756f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f756f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1d222a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="visitas" stroke="#0f756f" fillOpacity={1} fill="url(#colorVisitas)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Lembretes />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
