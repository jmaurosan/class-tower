
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';

interface CalendarRule {
  id: string;
  date: string;
  description: string;
  is_blocked: boolean;
  allowed_start_time?: string;
  allowed_end_time?: string;
}

interface CalendarRulesProps {
  user: User;
  rules: CalendarRule[];
  onUpdate: () => void;
  initialRuleIdToEdit?: string | null;
}

const CalendarRules: React.FC<CalendarRulesProps> = ({ user, rules, onUpdate, initialRuleIdToEdit }) => {
  const [newRule, setNewRule] = useState({
    date: '',
    description: '',
    is_blocked: true,
    allowed_start_time: '08:00',
    allowed_end_time: '18:00'
  });

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Se vier com uma regra específica pra editar da página de Agendamentos (quando clica num dia bloqueado)
  React.useEffect(() => {
    if (initialRuleIdToEdit) {
      const ruleToEdit = rules.find(r => r.id === initialRuleIdToEdit);
      if (ruleToEdit) {
        setEditingRuleId(ruleToEdit.id);
        setNewRule({
          date: ruleToEdit.date,
          description: ruleToEdit.description,
          is_blocked: ruleToEdit.is_blocked,
          allowed_start_time: ruleToEdit.allowed_start_time || '08:00',
          allowed_end_time: ruleToEdit.allowed_end_time || '18:00'
        });
      }
    }
  }, [initialRuleIdToEdit, rules]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRuleId) {
        const { error } = await supabase
          .from('condo_calendar_rules')
          .update({
            date: newRule.date,
            description: newRule.description,
            is_blocked: newRule.is_blocked,
            allowed_start_time: newRule.is_blocked ? null : newRule.allowed_start_time,
            allowed_end_time: newRule.is_blocked ? null : newRule.allowed_end_time
          })
          .eq('id', editingRuleId);

        if (error) throw error;
        setEditingRuleId(null);
        alert('Regra atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('condo_calendar_rules')
          .insert([{
            date: newRule.date,
            description: newRule.description,
            is_blocked: newRule.is_blocked,
            allowed_start_time: newRule.is_blocked ? null : newRule.allowed_start_time,
            allowed_end_time: newRule.is_blocked ? null : newRule.allowed_end_time,
            created_by: user.id
          }]);

        if (error) throw error;
        alert('Regra criada com sucesso!');
      }

      setNewRule({ date: '', description: '', is_blocked: true, allowed_start_time: '08:00', allowed_end_time: '18:00' });
      onUpdate();
    } catch (err) {
      console.error('Erro ao salvar regra:', err);
      alert('Erro ao salvar regra.');
    }
  };

  const handleEditClick = (rule: CalendarRule) => {
    setEditingRuleId(rule.id);
    setNewRule({
      date: rule.date,
      description: rule.description,
      is_blocked: rule.is_blocked,
      allowed_start_time: rule.allowed_start_time || '08:00',
      allowed_end_time: rule.allowed_end_time || '18:00'
    });
    // Scrollar pro topo suavemente se o modal estiver muito longo
    document.querySelector('.custom-scrollbar')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from('condo_calendar_rules').delete().eq('id', idToDelete);
      if (error) throw error;
      setShowDeleteModal(false);
      setIdToDelete(null);
      onUpdate();
    } catch (err) {
      console.error('Erro ao excluir regra:', err);
      alert('Erro ao excluir regra');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 mb-8 animate-in slide-in-from-top-4">
        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">edit_calendar</span>
          Gerenciar Feriados e Exceções
        </h4>

        <form onSubmit={handleCreateRule} className="space-y-4 mb-6">
          {/* Linha 1: Data e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Data</label>
              <input type="date" required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
                value={newRule.date} onChange={e => setNewRule({ ...newRule, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Descrição</label>
              <input type="text" required placeholder="Ex: Feriado Nacional, Natal, Manutenção..." className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
                value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
          </div>

          {/* Linha 2: Opção de Bloqueio — Botões bem visíveis */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Agendamento neste dia</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewRule({ ...newRule, is_blocked: true })}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                  newRule.is_blocked
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-300'
                }`}
              >
                <span className="material-symbols-outlined text-xl">block</span>
                <span>Bloquear<br /><span className="text-[10px] font-medium opacity-80">Nenhum agendamento</span></span>
              </button>

              <button
                type="button"
                onClick={() => setNewRule({ ...newRule, is_blocked: false })}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                  !newRule.is_blocked
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'
                }`}
              >
                <span className="material-symbols-outlined text-xl">schedule</span>
                <span>Horário Especial<br /><span className="text-[10px] font-medium opacity-80">Definir janela de horário</span></span>
              </button>
            </div>
          </div>

          {/* Linha 3: Horários (só se "Horário Especial" estiver selecionado) */}
          {!newRule.is_blocked && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Janela de Horário Permitido</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input type="time" required value={newRule.allowed_start_time} onChange={e => setNewRule({ ...newRule, allowed_start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white" />
                  <p className="text-[9px] text-slate-400 mt-1 ml-1">Início permitido</p>
                </div>
                <div className="self-center font-bold text-slate-400">→</div>
                <div className="flex-1">
                  <input type="time" required value={newRule.allowed_end_time} onChange={e => setNewRule({ ...newRule, allowed_end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white" />
                  <p className="text-[9px] text-slate-400 mt-1 ml-1">Fim permitido</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl hover:opacity-90 transition-all text-sm tracking-wide flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">{editingRuleId ? 'save' : 'add_circle'}</span>
              {editingRuleId ? 'Salvar Alterações' : 'Salvar Regra'}
            </button>
            {editingRuleId && (
              <button 
                type="button"
                onClick={() => {
                  setEditingRuleId(null);
                  setNewRule({ date: '', description: '', is_blocked: true, allowed_start_time: '08:00', allowed_end_time: '18:00' });
                }} 
                className="px-4 py-3 bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm tracking-wide flex items-center justify-center gap-2"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {rules.map(rule => (
            <div key={rule.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs">
                  {new Date(rule.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div className="font-bold text-slate-800 dark:text-white text-sm">{rule.description}</div>
                {rule.is_blocked ? (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded uppercase">Bloqueado</span>
                ) : (
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded uppercase">
                    {rule.allowed_start_time?.slice(0, 5)} - {rule.allowed_end_time?.slice(0, 5)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <button type="button" onClick={() => handleEditClick(rule)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Editar">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button type="button" onClick={() => handleDeleteClick(rule.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && <p className="text-center text-slate-400 py-4 text-xs font-medium italic">Nenhuma regra especial cadastrada.</p>}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-[24px] shadow-2xl max-w-sm w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Excluir Regra?</h3>
              <p className="text-slate-500 text-sm mt-2">Esta exceção de calendário será removida permanentemente.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarRules;
export type { CalendarRule };

