
import React from 'react';
import { validatePassword } from '../../utils/validators';

interface PasswordChecklistProps {
  password: string;
}

const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => {
  const validation = validatePassword(password);

  const requirements = [
    { label: 'Mínimo de 6 caracteres', met: validation.length },
    { label: 'Pelo menos uma letra maiúscula', met: validation.upper },
    { label: 'Pelo menos um caractere especial (@, #, $, etc.)', met: validation.special },
  ];

  return (
    <div className="space-y-2 mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requisitos de Segurança</p>
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-sm transition-colors ${req.met ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
            {req.met ? 'check_circle' : 'circle'}
          </span>
          <span className={`text-[11px] font-bold transition-colors ${req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PasswordChecklist;
