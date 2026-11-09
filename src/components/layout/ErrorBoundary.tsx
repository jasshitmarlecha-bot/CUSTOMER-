import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Showroom ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#2a0e04] text-[#faead1]">
          <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-4 shadow-2xl border border-orange-500/30">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-[#faead1]">Showroom Interface Restoring</h2>
            <p className="text-xs text-[#e2aa8e] leading-relaxed">
              The showroom suite encountered an unexpected display issue ({this.state.errorMessage}). Click below to refresh and clear cache.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="glow-btn px-6 py-2.5 rounded-full text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
            >
              Reset & Reload Suite
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
