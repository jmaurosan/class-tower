import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#15191e] p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1d222a] p-8 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
            <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Recarregar Página
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 text-sm font-bold text-slate-400 hover:text-primary transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
