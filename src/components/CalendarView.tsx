
import React, { useState } from 'react';
import { Agendamento } from '../types';

interface CalendarViewProps {
  events: Agendamento[];
  onSelectEvent?: (event: Agendamento) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarView: React.FC<CalendarViewProps> = ({ events, onSelectEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const navigate = (amount: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(currentDate.getMonth() + amount);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + amount * 7);
    else next.setDate(currentDate.getDate() + amount);
    setCurrentDate(next);
  };

  const resetToToday = () => setCurrentDate(new Date());

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

      days.push(
        <div key={day} className="h-24 md:h-32 p-1 md:p-2 bg-white dark:bg-[#1d222a] border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
          <span className={`text-xs font-bold ${isToday ? 'bg-primary text-white size-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
            {day}
          </span>
          <div className="mt-1 space-y-1 overflow-y-auto h-[calc(100%-24px)] custom-scrollbar">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onSelectEvent?.(event)}
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
          <div key={d} className="p-3 text-center text-[10px] font-black uppercase text-slate-400 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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

      days.push(
        <div key={i} className="flex-1 min-w-[120px] bg-white dark:bg-[#1d222a] border-r border-slate-200 dark:border-slate-800 min-h-[500px]">
          <div className={`p-4 text-center border-b border-slate-100 dark:border-slate-800 ${isToday ? 'bg-primary/5' : ''}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
            <p className={`text-xl font-black ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{date.getDate()}</p>
          </div>
          <div className="p-2 space-y-2">
            {dayEvents.sort((a, b) => a.hora.localeCompare(b.hora)).map(event => (
              <div
                key={event.id}
                onClick={() => onSelectEvent?.(event)}
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

    return (
      <div className="bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[500px]">
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </h4>
            <p className="text-slate-500 font-medium">{currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">event</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {dayEvents.length > 0 ? dayEvents.map(event => (
            <div key={event.id} onClick={() => onSelectEvent?.(event)} className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
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
              <span className="material-symbols-outlined text-6xl text-slate-200">event_busy</span>
              <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhum compromisso para hoje</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#1d222a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h3 className="text-lg font-black text-slate-900 dark:text-white min-w-[150px] text-center capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button onClick={resetToToday} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            Hoje
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
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
