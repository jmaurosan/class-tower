
import React from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLog } from '../types';

const AuditLogs: React.FC = () => {
  const { logs, loading } = useAuditLogs();
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterAction, setFilterAction] = React.useState<string>('');
  const [filterModule, setFilterModule] = React.useState<string>('');

  // Módulos únicos extraídos dos logs para o filtro
  const uniqueModules = React.useMemo(() => {
    const modules = new Set(logs.map(l => l.table_name));
    return Array.from(modules).sort();
  }, [logs]);

  // Filtragem dos logs
  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      // Filtro por ação
      if (filterAction && log.action !== filterAction) return false;

      // Filtro por módulo
      if (filterModule && log.table_name !== filterModule) return false;

      // Busca textual
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = log.executed_by_name?.toLowerCase().includes(term);
        const matchTable = formatTableName(log.table_name).toLowerCase().includes(term);
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDate = new Date(log.created_at).toLocaleDateString('pt-BR').includes(term);
        const matchOldData = log.old_data ? JSON.stringify(log.old_data).toLowerCase().includes(term) : false;
        const matchNewData = log.new_data ? JSON.stringify(log.new_data).toLowerCase().includes(term) : false;

        if (!matchName && !matchTable && !matchAction && !matchDate && !matchOldData && !matchNewData) return false;
      }

      return true;
    });
  }, [logs, searchTerm, filterAction, filterModule]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAction('');
    setFilterModule('');
  };

  const hasActiveFilters = searchTerm || filterAction || filterModule;

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
      case 'agendamentos': return 'Agendamento';
      case 'ocorrencias':
      case 'diario': return 'Ocorrência (Diário)';
      default: return table;
    }
  };

  const renderData = (data: any) => {
    if (!data) return null;
    if (typeof data !== 'object') return String(data);

    const labels: Record<string, string> = {
      id: 'ID',
      full_name: 'Nome Completo',
      email: 'E-mail',
      role: 'Perfil',
      sala_numero: 'Unidade',
      status: 'Status',
      permissions: 'Permissões',
      nome: 'Nome/Razão Social',
      responsavel1: 'Responsável 1',
      telefone1: 'Telefone 1',
      responsavel2: 'Responsável 2',
      telefone2: 'Telefone 2',
      andar: 'Andar',
      numero: 'Número',
      created_at: 'Criado em',
      updated_at: 'Atualizado em',
      action: 'Ação',
      reason: 'Motivo'
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(data).map(([key, value]) => {
          if (key === 'permissions' && typeof value === 'object') {
            const activePerms = Object.entries(value as any)
              .filter(([_, enabled]) => enabled)
              .map(([name]) => name)
              .join(', ');
            return activePerms ? (
              <div key={key} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{labels[key] || key}</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{activePerms}</p>
              </div>
            ) : null;
          }

          if (value === null || value === undefined || value === '') return null;
          
          let displayValue = String(value);
          if (key.includes('_at')) {
            displayValue = new Date(displayValue).toLocaleString('pt-BR');
          }

          return (
            <div key={key} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{labels[key] || key}</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{displayValue}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20">
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
            Rastreabilidade total do sistema. Cada alteração em registros críticos é capturada automaticamente para garantir transparência e integridade.
          </p>
        </div>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white dark:bg-[#1d222a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Campo de busca textual */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Buscar por nome, módulo, data ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Filtro por Ação */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer min-w-[150px]"
          >
            <option value="">Todas as Ações</option>
            <option value="INSERT">Inserção</option>
            <option value="UPDATE">Alteração</option>
            <option value="DELETE">Exclusão</option>
          </select>

          {/* Filtro por Módulo */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer min-w-[150px]"
          >
            <option value="">Todos os Módulos</option>
            {uniqueModules.map(mod => (
              <option key={mod} value={mod}>{formatTableName(mod)}</option>
            ))}
          </select>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-sm font-bold hover:bg-red-500/20 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">filter_alt_off</span>
              Limpar
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'resultado' : 'resultados'} encontrado{filteredLogs.length !== 1 ? 's' : ''}
          </div>
        )}
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black tracking-widest border uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatTableName(log.table_name)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {log.executed_by_name?.charAt(0) || 'S'}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{log.executed_by_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">{hasActiveFilters ? 'search_off' : 'history'}</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {hasActiveFilters ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum log registrado ainda'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-bold text-primary hover:underline mt-1">Limpar filtros</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES DO LOG */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 lg:p-8">
          <div className="bg-white dark:bg-[#1d222a] rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center border ${getActionColor(selectedLog.action)}`}>
                  <span className="material-symbols-outlined">{selectedLog.action === 'DELETE' ? 'delete' : selectedLog.action === 'INSERT' ? 'add' : 'edit'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Detalhes da Ação</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{selectedLog.record_id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-[#1d222a] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Módulo</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTableName(selectedLog.table_name)}</p>
                </div>
                <div className="p-4 bg-white dark:bg-[#1d222a] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.executed_by_name}</p>
                </div>
              </div>

              {selectedLog.old_data && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-red-500 text-sm">history</span>
                    <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Informações Removidas / Alteradas</h5>
                  </div>
                  <div className="p-5 bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-3xl">
                    {renderData(selectedLog.old_data)}
                  </div>
                </div>
              )}

              {selectedLog.new_data && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                    <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Novas Informações Registradas</h5>
                  </div>
                  <div className="p-5 bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl">
                    {renderData(selectedLog.new_data)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:opacity-90 transition-all text-xs uppercase tracking-widest"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
