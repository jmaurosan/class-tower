
import React from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';

const AuditLogs: React.FC = () => {
  const { logs, loading } = useAuditLogs();

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'UPDATE': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'INSERT': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
    }
  };

  const formatTableName = (table: string) => {
    switch (table) {
      case 'encomendas': return 'Encomenda';
      case 'avisos': return 'Aviso';
      case 'documentos': return 'Documento';
      case 'vistorias': return 'Vistoria';
      case 'vencimentos': return 'Vencimento';
      case 'profiles': return 'Perfil / Permissão';
      case 'ocorrencias': return 'Ocorrência';
      default: return table;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 dark:bg-black text-white p-8 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-[120px]">security</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500">security</span>
            <h4 className="text-sm font-black uppercase tracking-[0.2em]">Painel de Auditoria</h4>
          </div>
          <p className="mt-4 text-slate-400 max-w-xl">
            Rastreabilidade total do sistema. Cada alteração em registros críticos é capturada automaticamente via triggers de banco de dados para garantir transparência e integridade.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1d222a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ação</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Módulo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Executado Por</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">ID Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black tracking-widest border uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatTableName(log.table_name)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {log.executed_by_name?.charAt(0) || 'S'}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.executed_by_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-[10px] text-slate-400">
                    #{log.record_id.substring(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum log registrado ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
