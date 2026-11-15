import React, { useEffect, useRef, useState } from 'react';
import { Ear, Volume2, X } from 'lucide-react';

const FREQS = [500, 1000, 2000, 4000, 6000];
const REL_LEVELS_DB = [-20, -10, 0, 10];

export default function AudiometryModal({ isOpen, lang = 'es', onClose, onApplyResult }) {
  const isEn = lang === 'en';
  const [playingFreq, setPlayingFreq] = useState(null);
  const [ear, setEar] = useState('both'); // left | right | both
  const [relDb, setRelDb] = useState(0);
  const [shiftDb, setShiftDb] = useState(5);

  const audioCtxRef = useRef(null);
  const activeOscRef = useRef(null);
  const stopTimerRef = useRef(null);

  const stopAudio = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (activeOscRef.current) {
      try {
        activeOscRef.current.stop();
        activeOscRef.current.disconnect();
      } catch {
        // ya detenido
      }
      activeOscRef.current = null;
    }
    setPlayingFreq(null);
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setEar('both');
      setRelDb(0);
      setShiftDb(5);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      stopAudio();
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const playTone = async (freq) => {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Escala de amplitud por paso en dB relativos (0 dB = 0.08, acotado <= 0.25 por seguridad auditiva)
      const amplitude = Math.min(0.25, Math.max(0.005, 0.08 * Math.pow(10, relDb / 20)));
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(amplitude, now + 0.03);
      gain.gain.setValueAtTime(amplitude, now + 0.82);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.88);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = ear === 'left' ? -1 : ear === 'right' ? 1 : 0;
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      activeOscRef.current = osc;
      setPlayingFreq(freq);
      osc.start(now);
      osc.stop(now + 0.9);
      stopTimerRef.current = setTimeout(() => {
        if (activeOscRef.current === osc) {
          activeOscRef.current = null;
        }
        setPlayingFreq(null);
      }, 920);
    } catch {
      setPlayingFreq(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ear className="w-5 h-5 text-sky-700" />
            <h2 id="audio-modal-title" className="text-base font-bold text-slate-900">
              {isEn ? 'Hearing Screening (Web Audio API)' : 'Tamizaje Auditivo (Web Audio API)'}
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
              Continuous cabin fan/pump noise (55–72 dBA) impairs the <strong>4,000 Hz</strong> band first. Play constant-level pure tones with headphones per ear and report perceived shift vs your Earth baseline.
            </>
          ) : (
            <>
              El ruido continuo de ventiladores y bombas (55–72 dBA) afecta primero la banda de <strong>4,000 Hz</strong>. Reproduce tonos puros nivelados por oído y registra el corrimiento percibido respecto a tu basal.
            </>
          )}
        </p>

        {/* Selector lateralidad L / Ambos / R */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{isEn ? 'Ear:' : 'Oído:'}</span>
            {[
              { id: 'left', es: 'Izq (L)', en: 'Left (L)' },
              { id: 'both', es: 'Bilateral', en: 'Both' },
              { id: 'right', es: 'Der (R)', en: 'Right (R)' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEar(opt.id)}
                className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${
                  ear === opt.id
                    ? 'bg-[#0369a1] text-white border-[#0369a1]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isEn ? opt.en : opt.es}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">{isEn ? 'Level:' : 'Nivel:'}</span>
            {REL_LEVELS_DB.map((db) => (
              <button
                key={db}
                type="button"
                onClick={() => setRelDb(db)}
                className={`px-2 py-1 rounded-lg border font-semibold tabular-nums cursor-pointer ${
                  relDb === db
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {db > 0 ? `+${db}` : db} dB
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {FREQS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => playTone(f)}
              className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                playingFreq === f
                  ? 'bg-[#0369a1] text-white border-[#0369a1]'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-sky-50'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{f} Hz</span>
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span>
            {isEn ? 'Estimated 4,000 Hz shift vs baseline' : 'Corrimiento estimado en 4,000 Hz respecto a basal'}:{' '}
            {shiftDb} dB
          </span>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={shiftDb}
            onChange={(e) => setShiftDb(Number(e.target.value))}
            className="w-full accent-sky-700"
          />
          <span className="text-[11px] font-normal text-slate-600">
            {isEn
              ? 'NASA threshold: ≥ 15 dB shift at 4 kHz triggers active hearing protection.'
              : 'Umbral de alerta NASA: ≥ 15 dB de corrimiento en 4 kHz requiere protección auditiva activa.'}
          </span>
        </label>

        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {isEn
            ? 'Methodological note: Intra-subject relative dBFS screening via Web Audio; does not replace calibrated ANSI dB HL clinical audiometry.'
            : 'Nota metodológica: Tamizaje relativo intra-sujeto en dBFS (Web Audio); no sustituye audiometría clínica calibrada en dB HL.'}
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {isEn ? 'Close' : 'Cerrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyResult({ audiometry_shift_4khz_db: shiftDb });
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-sky-800 text-white text-xs font-semibold cursor-pointer"
          >
            {isEn ? 'Save Screening' : 'Guardar Tamizaje'}
          </button>
        </div>
      </div>
    </div>
  );
}
