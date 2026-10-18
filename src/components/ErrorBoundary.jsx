import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[EMOTIA ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl bg-[#121215] border border-red-500/30 p-6 shadow-card space-y-4 my-4 animate-fadeIn">
          <div className="flex items-center space-x-3 text-red-400">
            <div className="p-2 rounded-lg bg-red-950/50 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-mono">
                Screen Rendering Exception Caught
              </h3>
              <p className="text-xs text-zinc-400">
                A component failed to render cleanly. The rest of the application remains active.
              </p>
            </div>
          </div>

          <div className="bg-black/60 rounded-lg p-3 border border-white/[0.08] font-mono text-xs text-red-300 overflow-x-auto">
            {this.state.error?.toString() || 'Unknown error occurred'}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-medium border border-white/10 flex items-center space-x-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />
              <span>Retry Screen Render</span>
            </button>

            {this.props.onNavigateDashboard && (
              <button
                onClick={() => {
                  this.handleReset();
                  this.props.onNavigateDashboard();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/[0.08] flex items-center space-x-2 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
