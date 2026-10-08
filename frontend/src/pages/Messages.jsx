import React from 'react';
import { useLocation } from 'react-router-dom';
import WhatsAppChat from '../components/chat/WhatsAppChat';
import { MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

const Messages = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partnerId = searchParams.get('partner') || null;

  return (
    <div className="space-y-4">
      {/* Small top breadcrumb / context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl font-extrabold text-[#111b21] flex items-center gap-2">
            <MessageSquare className="text-[#008069]" size={22} />
            DermaIQ Care Circle Chat
          </h1>
          <p className="text-xs text-gray-500">
            Real-time direct messaging between Clients, Skincare Consultants, and Clinical Dermatologists.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold self-start sm:self-auto">
          <ShieldCheck size={14} className="text-emerald-600" />
          End-to-End Care Team Network
        </div>
      </div>

      {/* WhatsApp Chat Experience */}
      <WhatsAppChat initialPartnerId={partnerId} />
    </div>
  );
};

export default Messages;
