import React, { useEffect, useRef, useState } from 'react';
import { Timer, X } from 'lucide-react';

export default function PvtTestModal({ isOpen, lang = 'es', onClose, onApplyResult }) {
  const isEn = lang === 'en';
  const [phase, setPhase] = useState('idle'); // idle | waiting | stimulus | done
  const [timeLeft, setTimeLeft] = useState(30);
  const [rts, setRts] = useState([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [timedOutLapses, setTimedOutLapses] = useState(0);
  const stimStartRef = useRef(null);
  const waitTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const tapBtnRef = useRef(null);
  const phaseRef = useRef('idle');
  phaseRef.current = phase;

  const clearTimers = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      setPhase('idle');
      setTimeLeft(30);
      setRts([]);
      setFalseStarts(0);
      setTimedOutLapses(0);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimers();
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && (phase === 'waiting' || phase === 'stimulus')) {
      tapBtnRef.current?.focus();
    }
  }, [isOpen, phase]);

  // Finalizar prueba de manera pura fuera del state updater (StrictMode-safe)
  useEffect(() => {
    if (!isOpen || timeLeft > 0 || (phase !== 'waiting' && phase !== 'stimulus')) return;
    clearTimers();
    if (phase === 'stimulus' && stimStartRef.current) {
      const elapsedStim = Math.round(performance.now() - stimStartRef.current);
      if (elapsedStim >= 355) {
        setTimedOutLapses((tl) => tl + 1);
      }
    }
    setPhase('done');
  }, [isOpen, timeLeft, phase]);

  if (!isOpen) return null;

  const scheduleNextStimulus = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setPhase('waiting');
    const delay = 1200 + Math.random() * 2400;
    waitTimerRef.current = setTimeout(() => {
      stimStartRef.current = performance.now();
      setPhase('stimulus');
    }, delay);
  };

  const startTest = () => {
    clearTimers();
    setRts([]);
    setFalseStarts(0);
    setTimedOutLapses(0);
    setTimeLeft(30);
    scheduleNextStimulus();

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      setFalseStarts((f) => f + 1);
      return;
    }
    if (phase === 'stimulus') {
      const rt = Math.round(performance.now() - stimStartRef.current);
      // Criterio estándar PVT: RT < 100 ms es anticipación/falso inicio, no reacción fisiológica válida
      if (rt < 100) {
        setFalseStarts((f) => f + 1);
      } else {
        setRts((prev) => [...prev, rt]);
      }
      scheduleNextStimulus();
    }
  };

  const handleTapKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleTap();
    }
  };

  const showNoResponsePenalty = phase === 'done' && rts.length === 0;
  const meanRt = rts.length === 0 ? 999 : Math.round(rts.reduce((a, b) => a + b, 0) / rts.length);
  const lapses = showNoResponsePenalty
    ? 3
    : rts.filter((r) => r >= 355).length + timedOutLapses;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pvt-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-sky-700" />
            <h2 id="pvt-modal-title" className="text-base font-bold text-slate-900">
              {isEn ? 'Psychomotor Vigilance PVT-B (30 s Rapid Screen)' : 'Vigilancia Psicomotora PVT-B (Tamizaje 30 s)'}
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
              Measures psychomotor reaction speed. Tap or press <strong>Space</strong> immediately when the <strong>green signal</strong> appears. Response &lt; 100 ms counts as anticipation; ≥ 355 ms counts as a fatigue lapse.
            </>
          ) : (
            <>
              Mide tu velocidad de reacción psicomotora. Pulsa clic o barra <strong>Espacio</strong> apenas aparezca la <strong>señal verde</strong>. Un toque &lt; 100 ms cuenta como anticipación; ≥ 355 ms cuenta como lapsus de fatiga.
            </>
          )}
        </p>

        <div className="flex items-center justify-between text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 tabular-nums text-slate-800">
          <span>{isEn ? 'Time remaining' : 'Tiempo restante'}: {timeLeft} s</span>
          <span>
            {isEn ? 'Trials' : 'Intentos'}: {rts.length} · {isEn ? 'Lapses' : 'Lapsus'}: {lapses}
          </span>
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={startTest}
            className="w-full py-12 rounded-2xl bg-sky-50 border-2 border-dashed border-sky-400 text-sky-900 font-bold text-sm hover:bg-sky-100 cursor-pointer"
          >
            {isEn ? 'Start PVT Screening (30 seconds)' : 'Iniciar Prueba PVT (30 segundos)'}
          </button>
        )}

        {(phase === 'waiting' || phase === 'stimulus') && (
          <button
            ref={tapBtnRef}
            type="button"
            onClick={handleTap}
            onKeyDown={handleTapKeyDown}
            className={`w-full py-14 rounded-2xl font-bold text-base border-2 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-sky-600 ${
              phase === 'stimulus'
                ? 'bg-emerald-700 border-emerald-800 text-white shadow-lg'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {phase === 'stimulus'
              ? isEn
                ? 'TAP NOW!'
                : '¡PULSA AHORA!'
              : isEn
              ? 'Wait for the green signal...'
              : 'Espera la señal verde...'}
          </button>
        )}

        {phase === 'done' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {showNoResponsePenalty
                ? isEn
                  ? `No response (0 taps in 30 s) · Assigned lapses: ${lapses} · False starts: ${falseStarts}`
                  : `Sin respuesta (0 toques en 30 s) · Lapsus asignados: ${lapses} · Anticipaciones: ${falseStarts}`
                : isEn
                ? `Mean RT: ${meanRt} ms · Lapses (≥355 ms): ${lapses} · False starts: ${falseStarts}`
                : `Promedio: ${meanRt} ms · Lapsus (≥355 ms): ${lapses} · Anticipaciones: ${falseStarts}`}
            </div>
            <p className="text-xs text-slate-600">
              {showNoResponsePenalty
                ? isEn
                  ? 'Critical alert: 0 responses in 30 s (possible incapacitation / severe somnolence; No-Go EVA).'
                  : 'Alerta crítica: 0 respuestas durante 30 s (posible incapacitación o somnolencia severa; No-Go EVA).'
                : meanRt >= 355 || lapses >= 2
                ? isEn
                  ? 'Alert: Significant psychomotor fatigue (No-Go for EVA).'
                  : 'Alerta: Fatiga psicomotora significativa (No-Go para EVA).'
                : meanRt >= 280 || lapses === 1
                ? isEn
                  ? 'Caution: Mild slowing vs baseline.'
                  : 'Precaución: Leve enlentecimiento respecto a basal.'
                : isEn
                ? 'Nominal: Optimal operational alertness.'
                : 'Nominal: Reflejos óptimos para turno operativo.'}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  onApplyResult({ pvt_mean_rt_ms: meanRt, pvt_lapses: lapses });
                  onClose();
                }}
                className="flex-1 py-2 rounded-xl bg-[#0369a1] hover:bg-sky-800 text-white text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Log to Live Evaluation' : 'Registrar en Evaluación en Vivo'}
              </button>
              <button
                type="button"
                onClick={startTest}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {isEn ? 'Repeat' : 'Repetir'}
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {isEn
            ? 'Methodological note: 30 s rapid screening window adapted for mission demo ergonomics; official NASA PVT-B protocol runs 180 s (3 min).'
            : 'Nota metodológica: Ventana rápida de 30 s adaptada para demostración; el protocolo estándar NASA PVT-B completo dura 180 s (3 min).'}
        </p>
      </div>
    </div>
  );
}
