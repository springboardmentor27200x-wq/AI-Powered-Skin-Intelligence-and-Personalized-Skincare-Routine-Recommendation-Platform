import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center px-6">
      <div className="text-center max-w-md space-y-6">
        {/* Animated ghost icon */}
        <div className="relative inline-block">
          <div className="h-24 w-24 bg-[#e6edea] text-[#43685c] rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce" style={{ animationDuration: '2s' }}>
            <Ghost size={48} />
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-black text-[#1f302b]/10 leading-none">404</h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#1f302b]">Page not found</h2>
          <p className="text-gray-500">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1f302b] hover:bg-[#2e4740] text-white font-semibold rounded-xl shadow-md transition-all"
          >
            <Home size={16} />
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
