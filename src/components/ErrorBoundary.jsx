import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Error caught - UI will display error state
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="max-w-2xl w-full bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-700 mb-2">An error occurred</h2>
            <pre className="text-xs text-red-800 whitespace-pre-wrap">{String(error && error.stack ? error.stack : error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
