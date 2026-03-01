
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
}

const CalendarRules: React.FC<CalendarRulesProps> = ({ user, rules, onUpdate }) => {
  const [newRule, setNewRule] = useState({
    date: '',
    description: '',
    is_blocked: true,
    allowed_start_time: '08:00',
    allowed_end_time: '18:00'
  });

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      setNewRule({ date: '', description: '', is_blocked: true, allowed_start_time: '08:00', allowed_end_time: '18:00' });
      onUpdate();
      alert('Regra criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar regra:', err);
      alert('Erro ao salvar regra.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return;
    const { error } = await supabase.from('condo_calendar_rules').delete().eq('id', id);
    if (error) alert('Erro ao excluir regra');
    else onUpdate();
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 mb-8 animate-in slide-in-from-top-4">
      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined">edit_calendar</span>
        Gerenciar Feriados e Exceções
      </h4>

      <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input type="date" required className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
          value={newRule.date} onChange={e => setNewRule({ ...newRule, date: e.target.value })}
        />
        <input type="text" required placeholder="Descrição (ex: Natal)" className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
          value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })}
        />
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 rounded-xl border border-slate-300 dark:border-slate-700">
          <input type="checkbox" id="blocked" checked={newRule.is_blocked} onChange={e => setNewRule({ ...newRule, is_blocked: e.target.checked })} className="size-5 accent-primary" />
          <label htmlFor="blocked" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Bloquear Dia Inteiro</label>
        </div>

        {!newRule.is_blocked && (
          <div className="flex gap-2">
            <input type="time" required value={newRule.allowed_start_time} onChange={e => setNewRule({ ...newRule, allowed_start_time: e.target.value })} className="w-1/2 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border dark:text-white text-xs" title="Início" />
            <input type="time" required value={newRule.allowed_end_time} onChange={e => setNewRule({ ...newRule, allowed_end_time: e.target.value })} className="w-1/2 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border dark:text-white text-xs" title="Fim" />
          </div>
        )}

        <button type="submit" className="col-span-full md:col-span-1 lg:col-span-1 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transistion-colors text-sm">
          Adicionar Regra
        </button>
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
            <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        ))}
        {rules.length === 0 && <p className="text-center text-slate-400 py-4 text-xs font-medium italic">Nenhuma regra especial cadastrada.</p>}
      </div>
    </div>
  );
};

export default CalendarRules;
export type { CalendarRule };
