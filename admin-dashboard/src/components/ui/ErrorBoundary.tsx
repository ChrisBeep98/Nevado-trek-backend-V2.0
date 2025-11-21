import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LiquidButton } from './LiquidButton';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
                    <div className="glass-panel p-8 rounded-2xl max-w-md w-full flex flex-col items-center text-center space-y-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                            <AlertTriangle size={32} className="text-rose-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                            <p className="text-white/60 text-sm">
                                An unexpected error occurred. We've logged this issue and notified our team.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="w-full p-4 bg-black/30 rounded-lg border border-white/5 text-left overflow-hidden">
                                <p className="text-rose-300 font-mono text-xs break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <LiquidButton onClick={this.handleReload} className="w-full justify-center">
                            <RefreshCw size={18} className="mr-2" />
                            Reload Page
                        </LiquidButton>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
