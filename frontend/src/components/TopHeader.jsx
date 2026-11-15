import React from 'react';
import { Atom, Home } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';

const ENV_SHORT_LABELS = {
  es: {
    iss: 'ISS (0g)',
    transit: 'Tránsito (0g)',
    rover: 'Rover Lunar (0.165g)',
    mars_base: 'Base Marte (0.38g)',
  },
  en: {
    iss: 'ISS (0g)',
    transit: 'Transit (0g)',
    rover: 'Lunar Rover (0.165g)',
    mars_base: 'Mars Base (0.38g)',
  },
};

export default function TopHeader({
  environments,
  activeEnvId,
  onSelectEnv,
  baseline,
  onOpenEmergency,
  onOpenBaseline,
  onOpenPhysics,
  onGoHome,
  lang = 'es',
  onChangeLang,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const envLabels = ENV_SHORT_LABELS[lang] || ENV_SHORT_LABELS.es;
  const activeEnv = environments?.[activeEnvId];
  const rttSeconds = activeEnv?.rtt_seconds ?? 0.05;
  const isAutonomous = rttSeconds > 10;

  return (
    <header className="bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 sticky top-0 z-30">
      {/* Identidad del sistema y tripulante */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-[#0b3d91] flex items-center justify-center text-white shadow-xs shrink-0">
          <svg
            viewBox="0 0 64 64"
            className="w-7 h-7"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="25" cy="11" r="2.6" fill="#ffffff" />
            <circle cx="39" cy="11" r="2.6" fill="#ffffff" />
            <path
              d="M25 11 C20 12 20 28 32 28 C44 28 44 12 39 11"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M32 28 C32 33 36 36 42 40"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <ellipse
              cx="32"
              cy="43"
              rx="16"
              ry="7.5"
              transform="rotate(-35 32 43)"
              stroke="#ffffff"
              strokeWidth="2.8"
            />
            <ellipse
              cx="32"
              cy="43"
              rx="16"
              ry="7.5"
              transform="rotate(35 32 43)"
              stroke="#ffffff"
              strokeWidth="2.8"
            />
            <circle cx="32" cy="43" r="3.8" fill="#ffffff" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              EIMO <span className="font-normal text-slate-400">|</span> Astronaut Health CDSS
            </h1>
            <div
              className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 whitespace-nowrap"
              title={t.rttTitle}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAutonomous ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
              />
              <span>{activeEnv?.rtt_label || (lang === 'en' ? 'Real-time' : 'Tiempo real')}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBaseline}
            className="text-xs text-slate-600 hover:text-sky-700 mt-0.5 transition-colors cursor-pointer text-left"
          >
            {baseline?.callsign || (lang === 'en' ? 'Crew' : 'Tripulante')} ·{' '}
            {lang === 'en' ? 'Mission Day' : 'Día de Misión'} {baseline?.mission_day ?? 1}
          </button>
        </div>
      </div>

      {/* Selector de Entorno Multi-Gravedad */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
        {Object.keys(envLabels).map((envId) => {
          const active = activeEnvId === envId;
          return (
            <button
              key={envId}
              type="button"
              onClick={() => onSelectEnv(envId)}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-[#0369a1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              {envLabels[envId]}
            </button>
          );
        })}
      </div>

      {/* Inicio + Fórmulas + Switch ES | EN + Botón Permanente de Emergencia Aguda */}
      <div className="flex items-center gap-2 shrink-0">
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            title={lang === 'en' ? 'Back to Project Overview' : 'Volver a Portada de Inicio'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-[11px] font-semibold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden 2xl:inline">{lang === 'en' ? 'Home' : 'Inicio'}</span>
          </button>
        )}

        {onOpenPhysics && (
          <button
            type="button"
            onClick={onOpenPhysics}
            title={lang === 'en' ? 'Biophysical Equations' : 'Ecuaciones Biofísicas del Motor'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-[11px] font-semibold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
          >
            <Atom className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden 2xl:inline">{lang === 'en' ? 'Physics' : 'Fórmulas'}</span>
          </button>
        )}

        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onChangeLang?.('es')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              lang === 'es' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => onChangeLang?.('en')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              lang === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenEmergency}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/25 transition-all whitespace-nowrap cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <span>{t.emergencyBtn}</span>
        </button>
      </div>
    </header>
  );
}
