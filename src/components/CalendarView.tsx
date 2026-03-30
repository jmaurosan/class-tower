
import React, { useState } from 'react';
import { Agendamento } from '../types';
import { CalendarRule } from './CalendarRules';

interface CalendarViewProps {
  events: Agendamento[];
  rules?: CalendarRule[];
  onSelectEvent?: (event: Agendamento) => void;
  onDateClick?: (date: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarView: React.FC<CalendarViewProps> = ({ events, rules = [], onSelectEvent, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Retorna a regra especial de uma data específica (se existir)
  const getRuleForDate = (dateStr: string): CalendarRule | undefined => {
    return rules.find(r => r.date === dateStr);
  };

  const navigate = (amount: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(currentDate.getMonth() + amount);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + amount * 7);
    else next.setDate(currentDate.getDate() + amount);
    setCurrentDate(next);
  };

  const resetToToday = () => setCurrentDate(new Date());

  // Retorna as classes de cor para uma célula de dia baseado na regra
  const getDayCellClass = (dateStr: string, isToday: boolean): string => {
    const rule = getRuleForDate(dateStr);
    if (rule?.is_blocked) {
      return 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/50 cursor-not-allowed';
    }
    if (rule && !rule.is_blocked) {
      return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 cursor-pointer hover:bg-amber-100/50';
    }
    if (isToday) {
      return 'bg-primary/5 dark:bg-primary/10 border-primary/20 cursor-pointer hover:bg-primary/10';
    }
    return 'bg-white dark:bg-[#1d222a] border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50';
  };

  // Badge de feriado/exceção para exibir dentro da célula
  const renderRuleBadge = (dateStr: string) => {
    const rule = getRuleForDate(dateStr);
    if (!rule) return null;

    if (rule.is_blocked) {
      return (
        <div className="mt-0.5 px-1 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[8px] font-black truncate flex items-center gap-0.5">
          <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>block</span>
          {rule.description}
        </div>
      );
    }
    return (
      <div className="mt-0.5 px-1 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded text-[8px] font-black truncate flex items-center gap-0.5">
        <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>schedule</span>
        {rule.description}
      </div>
    );
  };

  // Handler de clique que respeita se o dia está bloqueado
  const handleDateClick = (dateStr: string) => {
    const rule = getRuleForDate(dateStr);
    if (rule?.is_blocked) return; // Dia bloqueado — não abre agendamento
    onDateClick?.(dateStr);
  };

  // Views rendering
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.data === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const rule = getRuleForDate(dateStr);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateStr)}
          title={rule?.is_blocked ? `🔴 ${rule.description} — Agendamento bloqueado` : rule ? `⚠️ ${rule.description}` : undefined}
          className={`h-24 md:h-32 p-1 md:p-2 border relative group overflow-hidden transition-colors ${getDayCellClass(dateStr, isToday)}`}
        >
          <span className={`text-xs font-bold ${isToday ? 'bg-primary text-white size-6 flex items-center justify-center rounded-full' : rule?.is_blocked ? 'text-red-500' : 'text-slate-400'}`}>
            {day}
          </span>
          {rule?.is_blocked && (
            <span className="material-symbols-outlined text-red-400 text-[14px] absolute top-1 right-1">do_not_disturb_on</span>
          )}
          <div className="mt-1 space-y-0.5 overflow-y-auto h-[calc(100%-24px)] custom-scrollbar">
            {renderRuleBadge(dateStr)}
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent?.(event);
                }}
                className="text-[9px] md:text-[10px] p-1 rounded bg-primary/10 text-primary border border-primary/20 truncate cursor-pointer hover:bg-primary/20 transition-colors"
                title={`${event.hora} - ${event.titulo}`}
              >
                <b>{event.hora}</b> {event.titulo}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="p-1 md:p-3 text-center text-[8px] md:text-[10px] font-black uppercase text-slate-400 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {d}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.data === dateStr);
      const isToday = new Date().toDateString() === date.toDateString();
      const rule = getRuleForDate(dateStr);

      days.push(
        <div
          key={i}
          onClick={() => handleDateClick(dateStr)}
          title={rule?.is_blocked ? `🔴 ${rule.description} — Bloqueado` : undefined}
          className={`flex-1 min-w-[120px] border-r border-slate-200 dark:border-slate-800 min-h-[500px] transition-colors ${rule?.is_blocked ? 'bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed' : 'bg-white dark:bg-[#1d222a] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
        >
          <div className={`p-4 text-center border-b border-slate-100 dark:border-slate-800 ${isToday ? 'bg-primary/5' : rule?.is_blocked ? 'bg-red-500/10' : ''}`}>
            <p className={`text-[10px] font-black uppercase ${rule?.is_blocked ? 'text-red-400' : 'text-slate-400'}`}>{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
            <p className={`text-xl font-black ${isToday ? 'text-primary' : rule?.is_blocked ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{date.getDate()}</p>
            {rule && (
              <p className={`text-[8px] font-black uppercase truncate mt-0.5 ${rule.is_blocked ? 'text-red-400' : 'text-amber-500'}`}>
                {rule.is_blocked ? '🔴' : '⚠️'} {rule.description}
              </p>
            )}
          </div>
          <div className="p-2 space-y-2">
            {dayEvents.sort((a, b) => a.hora.localeCompare(b.hora)).map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent?.(event);
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-primary/30 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-primary mb-1">{event.hora}</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{event.titulo}</p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">{event.tipo}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex border-l border-t border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
        {days}
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.data === dateStr).sort((a, b) => a.hora.localeCompare(b.hora));
    const rule = getRuleForDate(dateStr);

    return (
      <div className={`border rounded-2xl overflow-hidden min-h-[500px] ${rule?.is_blocked ? 'border-red-300 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1d222a]'}`}>
        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center ${rule?.is_blocked ? 'bg-red-500/10' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </h4>
            <p className="text-slate-500 font-medium">{currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {rule && (
              <p className={`text-xs font-black mt-1 flex items-center gap-1 ${rule.is_blocked ? 'text-red-500' : 'text-amber-500'}`}>
                <span className="material-symbols-outlined text-sm">{rule.is_blocked ? 'do_not_disturb_on' : 'schedule'}</span>
                {rule.description}
                {rule.is_blocked ? ' — Agendamento bloqueado' : ` (${rule.allowed_start_time?.slice(0, 5)} - ${rule.allowed_end_time?.slice(0, 5)})`}
              </p>
            )}
          </div>
          <div className={`size-12 rounded-full flex items-center justify-center ${rule?.is_blocked ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined text-3xl">{rule?.is_blocked ? 'event_busy' : 'event'}</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {dayEvents.length > 0 ? dayEvents.map(event => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent?.(event);
              }}
              className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="text-center min-w-[60px]">
                <p className="text-xl font-black text-primary">{event.hora}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Início</p>
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{event.tipo}</p>
                <h5 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{event.titulo}</h5>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {event.local}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span>
            </div>
          )) : (
            <div className="py-20 text-center space-y-3">
              <span className="material-symbols-outlined text-6xl text-slate-200">{rule?.is_blocked ? 'do_not_disturb_on' : 'event_busy'}</span>
              <p className={`font-bold uppercase tracking-widest ${rule?.is_blocked ? 'text-red-400' : 'text-slate-400'}`}>
                {rule?.is_blocked ? `Dia bloqueado: ${rule.description}` : 'Nenhum compromisso para hoje'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Legenda
  const hasRules = rules.length > 0;

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex flex-col gap-3 bg-white dark:bg-[#1d222a] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl text-slate-600 dark:text-slate-300">chevron_left</span>
            </button>
            <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-white text-center capitalize whitespace-nowrap">
              {viewMode === 'day'
                ? currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                : currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => navigate(1)} className="p-1 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl text-slate-600 dark:text-slate-300">chevron_right</span>
            </button>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 md:p-1 rounded-xl shrink-0">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {mode === 'month' ? 'Mês' : mode === 'week' ? 'Sem' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda das regras */}
        {hasRules && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">
              <span className="size-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-300 inline-block"></span>
              Dia Bloqueado
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
              <span className="size-3 rounded-sm bg-amber-100 dark:bg-amber-900/30 border border-amber-300 inline-block"></span>
              Horário Especial
            </span>
          </div>
        )}
      </div>

      {/* Visualização Selecionada */}
      <div className="animate-in fade-in zoom-in-95 duration-300">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView;
