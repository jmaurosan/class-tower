import React, { useState } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = 'Digite sua senha',
  required = false,
  className = '',
  label
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-700 rounded-xl 
            bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            transition-all ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-xl">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
