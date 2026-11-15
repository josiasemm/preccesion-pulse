import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Wind, X } from 'lucide-react';

export default function BreathingModal({
  isOpen,
  telemetry = {},
  evaluation = null,
  lang = 'es',
  onClose,
  onComplete,
}) {
  const isEn = lang === 'en';
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // 0..9 segundos por ciclo (4s inhala, 6s exhala)
  const [cycles, setCycles] = useState(0);
  const completedSentRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const organicMimics = evaluation?.models?.neuro_and_anxiety?.organic_mimics_detected || [];
  const spo2Val = telemetry?.spo2_percent ?? telemetry?.spo2_pct ?? 100;
  const hasDirectMimic =
    (telemetry?.cabin_ppco2_mmhg ?? 0) > 3.0 ||
    spo2Val < 94.0 ||
    (telemetry?.glucose_mg_dl ?? 90) < 70.0;
  const isBlocked = organicMimics.length > 0 || hasDirectMimic;

  useEffect(() => {
    if (!isOpen) {
      setRunning(false);
      setElapsed(0);
      setCycles(0);
      completedSentRef.current = false;
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !running || isBlocked) {
      if (isBlocked && running) setRunning(false);
      return undefined;
    }
    const id = setInterval(() => {
      setElapsed((prev) => (prev + 1) % 10);
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, running, isBlocked]);

  // Incrementar contador de ciclos cuando se completa la fase de exhalación (segundo 9 -> 0)
  const prevElapsedRef = useRef(0);
  useEffect(() => {
    if (running && prevElapsedRef.current === 9 && elapsed === 0) {
      setCycles((c) => c + 1);
    }
    prevElapsedRef.current = elapsed;
  }, [elapsed, running]);

  useEffect(() => {
    if (cycles >= 18 && !completedSentRef.current) {
      completedSentRef.current = true;
      onCompleteRef.current?.();
    }
  }, [cycles]);

  if (!isOpen) return null;

  const isInhale = elapsed < 4;
  const phaseSec = isInhale ? 4 - elapsed : 10 - elapsed;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-emerald-700" />
            <h2 id="breathing-modal-title" className="text-base font-bold text-slate-900">
              {isEn ? 'Vagal Resonance (0.1 Hz · 6 breaths/min)' : 'Resonancia Vagal (0.1 Hz · 6 resp/min)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Cerrar'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isEn ? (
            <>
              Synchronizes arterial baroreflex with HRV (<strong>4 s inhale / 6 s exhale</strong>, normal tidal volume — avoid hyperventilation). Only indicated after ruling out high CO₂, hypoxia, and hypoglycemia.
            </>
          ) : (
            <>
              Sincroniza el barorreflejo arterial con la HRV (<strong>4 s inhalar / 6 s exhalar</strong>, volumen corriente suave sin hiperventilar). Indicado solo tras descartar CO₂ alto, hipoxia e hipoglucemia.
            </>
          )}
        </p>

        {isBlocked && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {isEn ? 'Slow breathing blocked by active organic mimic' : 'Respiración lenta bloqueada por imitador orgánico activo'}
              </p>
              <p className="text-[11px] text-rose-800 mt-0.5">
                {organicMimics.length
                  ? organicMimics.join(' · ')
                  : isEn
                  ? 'ppCO₂ > 3.0 mmHg, SpO₂ < 94% / Glucose < 70 mg/dL'
                  : 'ppCO₂ > 3.0 mmHg, SpO₂ < 94% / Glucosa < 70 mg/dL'}
                .{' '}
                {isEn
                  ? 'Treat physical cause before vagal pacing.'
                  : 'Corrige la causa física antes de iniciar guía vagal.'}
              </p>
            </div>
          </div>
        )}

        <div className="py-5 px-4 flex flex-col items-center justify-center bg-amber-50/40 border border-amber-200/70 rounded-2xl gap-3">
          {/* Contenedor de altura fija (0 px de salto vertical) con escalado continuo 4s / 6s */}
          <div className="h-36 w-36 flex items-center justify-center shrink-0">
            <div
              style={{
                transform: running ? (isInhale ? 'scale(1)' : 'scale(0.68)') : 'scale(0.8)',
                transition: running
                  ? `transform ${isInhale ? '4000ms' : '6000ms'} ease-in-out, background-color 600ms ease`
                  : 'transform 300ms ease',
              }}
              className={`w-36 h-36 rounded-full flex items-center justify-center font-bold text-sm will-change-transform ${
                running
                  ? isInhale
                    ? 'bg-emerald-200 text-emerald-950 border-2 border-emerald-600'
                    : 'bg-sky-100 text-sky-950 border-2 border-sky-500'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-300'
              }`}
            >
              {running
                ? isInhale
                  ? `${isEn ? 'Inhale' : 'Inhala'} (${phaseSec}s)`
                  : `${isEn ? 'Exhale' : 'Exhala'} (${phaseSec}s)`
                : isEn
                ? 'Ready'
                : 'Listo'}
            </div>
          </div>
          <div className="text-center space-y-1">
            <span className="block text-xs font-bold text-amber-950 tabular-nums">
              {isEn ? 'Cycles completed' : 'Ciclos completados'}: {cycles} / 18 (3 min)
            </span>
            <span className="block text-[11px] text-amber-900">
              {isEn
                ? 'Presleep: dim amber lighting and avoid caffeine.'
                : 'Pre-sueño: usar luz tenue ámbar y evitar cafeína.'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          {cycles >= 1 && cycles < 18 ? (
            <button
              type="button"
              onClick={() => {
                onComplete?.();
                onClose?.();
              }}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              {isEn ? 'Log partial session ✓' : 'Registrar sesión parcial ✓'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {isEn ? 'Close' : 'Cerrar'}
            </button>
            <button
              type="button"
              disabled={isBlocked}
              onClick={() => setRunning((r) => !r)}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer"
            >
              {running
                ? isEn
                  ? 'Pause Session'
                  : 'Pausar Sesión'
                : isEn
                ? 'Start 0.1 Hz Pacer'
                : 'Iniciar Guía 0.1 Hz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
