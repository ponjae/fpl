import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorPage from '../../pages/ErrorPage';

type ErrorProps = {
  children?: ReactNode;
};

type ErrorState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorProps, ErrorState> {
  /**
   * @override
   */
  public override state: ErrorState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true };
  }

  /**
   * @override
   */
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  /**
   * @override
   */
  public override render() {
    const { hasError } = this.state;
    if (hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
