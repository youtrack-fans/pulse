import React from 'react';

interface ErrorBoundaryProps {
  fallback: (reset: () => void) => React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(): ErrorBoundaryState {
    return {failed: true};
  }

  state: ErrorBoundaryState = {failed: false};

  reset = (): void => {
    this.setState({failed: false});
  };

  render(): React.ReactNode {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children;
  }
}
