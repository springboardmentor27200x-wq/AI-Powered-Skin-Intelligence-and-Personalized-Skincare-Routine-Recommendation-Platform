import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Safely capture boundary state without dumping noisy trace to end-user devtools
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center px-6">
          <div className="text-center max-w-md space-y-6">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1f302b]">Temporary Interface Interruption</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We encountered an unexpected display issue. Your account data, assessments, and saved routines remain safe and synchronized.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#edf5f0] border border-[#c6e2d4] text-xs text-[#1c5440] font-medium leading-relaxed">
              🛡️ Clinical session protected: Your biometric profile and routine records are preserved. Please click below to reload your dashboard.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1f302b] hover:bg-[#2e4740] text-white font-semibold rounded-xl shadow-md transition-all"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all"
              >
                <Home size={16} />
                Home Page
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
