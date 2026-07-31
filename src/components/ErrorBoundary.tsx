import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Captured error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            Algo inesperado aconteceu
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
            Ocorreu um erro ao carregar esta seção. Isso não afeta o resto do sistema.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
          <p className="text-[9px] text-slate-400 mt-3">
            Se o erro persistir, recarregue a página.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
