
import React, { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const Lembretes: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Revisar laudo da Unidade 1402', completed: false },
    { id: 2, text: 'Confirmar agendamento com técnico de HVAC', completed: true },
    { id: 3, text: 'Verificar nível crítico de estoque de filtros', completed: false },
  ]);
  const [inputValue, setInputValue] = useState('');

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    
    const newTodo: Todo = {
      id: Date.now(),
      text: text,
      completed: false,
    };
    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
  };

  const removeTodo = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evita marcar como concluído ao deletar
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;

  return (
    <div className="bg-white dark:bg-[#1d222a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px] transition-colors duration-300">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">sticky_note_2</span>
          Lembretes do Gestor
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Anotações e tarefas rápidas</p>
      </div>

      <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <form onSubmit={addTodo} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Adicionar nova tarefa..."
            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined font-bold">add_circle</span>
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {todos.length > 0 ? (
          todos.map((todo) => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                todo.completed
                  ? 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/50'
                  : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`material-symbols-outlined shrink-0 transition-colors ${
                  todo.completed ? 'text-emerald-500 fill-1' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  {todo.completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={`text-sm font-medium truncate transition-all duration-300 ${
                  todo.completed 
                    ? 'line-through text-slate-400 dark:text-slate-600' 
                    : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {todo.text}
                </span>
              </div>
              <button
                onClick={(e) => removeTodo(e, todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0"
                title="Excluir"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <span className="material-symbols-outlined text-2xl">done_all</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma tarefa</p>
            <p className="text-[10px] text-slate-500">Organize seu dia adicionando novos itens acima.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500"></span>
          <span>{completedCount} Concluídos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-500"></span>
          <span>{pendingCount} Pendentes</span>
        </div>
      </div>
    </div>
  );
};

export default Lembretes;
