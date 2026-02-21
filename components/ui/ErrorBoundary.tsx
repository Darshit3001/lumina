// ============================================================
// Error Boundary — Catches rendering errors with glass UI
// ============================================================

"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] items-center justify-center p-8">
          <div className="glass rounded-2xl p-8 text-center max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-white/40 mb-5">
              {this.props.fallbackMessage ||
                "An error occurred while rendering this section."}
            </p>
            {this.state.error && (
              <pre className="mb-5 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-white/30 overflow-auto max-h-24 text-left">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={this.handleReset}
              variant="secondary"
              className="bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
