"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable error boundary for dashboard components.
 * Catches rendering errors and shows a friendly fallback instead of crashing
 * the entire page. Each dashboard tab is wrapped in its own boundary
 * so one broken component doesn't take down the whole dashboard.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-warning-muted flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 mb-1">
            {this.props.fallbackTitle ?? "Component Error"}
          </h3>
          <p className="text-xs text-slate-900/40 mb-4 max-w-sm mx-auto">
            This section encountered an error. Your data is safe &mdash; other dashboard sections are unaffected.
          </p>
          {this.state.error && (
            <p className="text-[10px] text-slate-900/20 font-mono mb-4 max-w-md mx-auto break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-1.5 text-xs text-brand-300 hover:text-brand-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
