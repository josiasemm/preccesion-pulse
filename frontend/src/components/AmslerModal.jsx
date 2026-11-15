import React, { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';

export default function AmslerModal({ isOpen, lang = 'es', onClose, onApplyResult }) {
  const isEn = lang === 'en';
  const [activeEye, setActiveEye] = useState('OD'); // OD (right) | OS (left)
  const [odCells, setOdCells] = useState([]);
  const [osCells, setOsCells] = useState([]);
  const [acuity, setAcuity] = useState('20/20');

  useEffect(() => {
    if (isOpen) {
      setActiveEye('OD');
      setOdCells([]);
      setOsCells([]);
      setAcuity('20/20');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markedCells = activeEye === 'OD' ? odCells : osCells;
  const setEyeCells = activeEye === 'OD' ? setOdCells : setOsCells;

  const toggleCell = (idx) => {
    setEyeCells((prev) => (prev.includes(idx) ? prev.filter((c) => c !== idx) : [...prev, idx]));
  };

  const totalDistortions = odCells.length + osCells.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="amsler-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-600" />
            <h2 id="amsler-modal-title" className="text-base font-bold text-slate-900">
              {isEn ? 'Amsler Grid & Near Acuity (SANS)' : 'Rejilla de Amsler + Agudeza Cercana (SANS)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Cerrar'}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isEn ? (
            <>
              Hold screen at <strong>30–35 cm</strong> wearing near-correction lenses if prescribed. Cover one eye at a time, fixate on the <strong>black dot</strong>, and click any wavy or dark (scotoma) zone.
            </>
          ) : (
            <>
              Mantén la pantalla a <strong>30–35 cm</strong> con tus lentes de lectura si los usas. Tapa un ojo a la vez, fija la mirada en el <strong>punto negro central</strong> y marca líneas onduladas o escotomas.
            </>
          )}
        </p>

        {/* Selector OD / OS */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'OD', label: isEn ? `Right Eye (OD) · ${odCells.length}` : `Ojo Derecho (OD) · ${odCells.length}` },
            { id: 'OS', label: isEn ? `Left Eye (OS) · ${osCells.length}` : `Ojo Izquierdo (OS) · ${osCells.length}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEye(tab.id)}
              className={`py-2 px-3 rounded-xl border font-bold cursor-pointer transition-colors ${
                activeEye === tab.id
                  ? 'bg-[#0369a1] text-white border-[#0369a1]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cuadrícula 9x9 con punto central no editable */}
        <div className="flex justify-center">
          <div className="relative grid grid-cols-9 w-64 h-64 border-2 border-slate-800 bg-white">
            {Array.from({ length: 81 }).map((_, idx) => {
              const marked = markedCells.includes(idx);
              const isCenter = idx === 40;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isCenter}
                  aria-pressed={isCenter ? undefined : marked}
                  onClick={() => !isCenter && toggleCell(idx)}
                  aria-label={
                    isCenter
                      ? isEn
                        ? 'Central fixation dot'
                        : 'Punto de fijación central'
                      : isEn
                      ? `Grid cell ${idx + 1}`
                      : `Celda ${idx + 1}`
                  }
                  className={`border border-slate-300 flex items-center justify-center transition-colors ${
                    isCenter
                      ? 'cursor-default bg-white'
                      : marked
                      ? 'bg-rose-400/75 cursor-pointer'
                      : 'hover:bg-sky-50 cursor-pointer'
                  }`}
                >
                  {isCenter && <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            {isEn ? 'Near Acuity:' : 'Agudeza Cercana:'}
            <select
              value={acuity}
              onChange={(e) => setAcuity(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs"
            >
              <option value="20/20">20/20 (Nominal)</option>
              <option value="20/30">{isEn ? '20/30 (Mild shift)' : '20/30 (Desviación leve)'}</option>
              <option value="20/40">{isEn ? '20/40 (Hyperopic shift)' : '20/40 (Desviación hiperópica)'}</option>
            </select>
          </label>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {isEn ? 'Total OU' : 'Total AO'}: {totalDistortions}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {isEn
            ? 'Methodological note: 9×9 digital rapid screening grid (~2°/cell); clinical standard Amsler card uses 20×20 squares at 1° visual angle.'
            : 'Nota metodológica: Rejilla digital rápida 9×9 (~2°/celda); la cartilla clínica Amsler estándar utiliza 20×20 cuadros a 1° visual.'}
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEyeCells([])}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {isEn ? `Clear ${activeEye}` : `Limpiar ${activeEye}`}
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyResult({
                amsler_distortions: totalDistortions,
                near_acuity: acuity,
              });
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-sky-800 text-white text-xs font-semibold cursor-pointer"
          >
            {isEn ? 'Save & Evaluate' : 'Guardar y Evaluar'}
          </button>
        </div>
      </div>
    </div>
  );
}
