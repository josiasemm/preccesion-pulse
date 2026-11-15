import React from 'react';
import { FlaskConical } from 'lucide-react';

export default function FloatingMenu({ demoMode, onToggleDemo, lang = 'es' }) {
  const isEn = lang === 'en';

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        type="button"
        onClick={onToggleDemo}
        title={isEn ? 'Toggle Judge Demo Simulator' : 'Activar/desactivar Simulador Demo para jueces'}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-md text-xs font-semibold transition-all cursor-pointer ${
          demoMode
            ? 'bg-[#0369a1] text-white border-[#0369a1]'
            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span>{isEn ? 'Demo' : 'Demo'}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            demoMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {demoMode ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
