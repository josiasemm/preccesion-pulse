import React, { useEffect, useRef, useState } from 'react';
import { Stethoscope, X } from 'lucide-react';

export default function SymptomsModal({ isOpen, telemetry = {}, lang = 'es', onClose, onApplyResult }) {
  const wasOpenRef = useRef(false);
  const [form, setForm] = useState({
    flank_pain: false,
    skin_rash_or_viral_symptoms: false,
    pocus_dvt_suspicion: false,
    ecg_arrhythmia_detected: false,
    has_emesis: false,
    time_to_emesis_hours: 1.5,
    anxiety_vas: 2,
    gad2_score: 0,
    sleep_hours: 7.2,
  });

  useEffect(() => {
    if (isOpen && !wasOpenRef.current && telemetry) {
      setForm({
        flank_pain: Boolean(telemetry.flank_pain),
        skin_rash_or_viral_symptoms: Boolean(telemetry.skin_rash_or_viral_symptoms),
        pocus_dvt_suspicion: Boolean(telemetry.pocus_dvt_suspicion),
        ecg_arrhythmia_detected: Boolean(telemetry.ecg_arrhythmia_detected),
        has_emesis: telemetry.time_to_emesis_hours !== null && telemetry.time_to_emesis_hours !== undefined,
        time_to_emesis_hours: telemetry.time_to_emesis_hours ?? 1.5,
        anxiety_vas: telemetry.anxiety_vas ?? 2,
        gad2_score: telemetry.gad2_score ?? 0,
        sleep_hours: telemetry.sleep_hours ?? 7.2,
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, telemetry]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEn = lang === 'en';
  const numOr = (v, fb) => (v === '' || v === null || v === undefined ? fb : Number(v));

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyResult({
      flank_pain: Boolean(form.flank_pain),
      skin_rash_or_viral_symptoms: Boolean(form.skin_rash_or_viral_symptoms),
      pocus_dvt_suspicion: Boolean(form.pocus_dvt_suspicion),
      ecg_arrhythmia_detected: Boolean(form.ecg_arrhythmia_detected),
      time_to_emesis_hours: form.has_emesis ? numOr(form.time_to_emesis_hours, 1.5) : null,
      anxiety_vas: Number(form.anxiety_vas),
      gad2_score: numOr(form.gad2_score, telemetry.gad2_score ?? 0),
      sleep_hours: numOr(form.sleep_hours, telemetry.sleep_hours ?? 7.2),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="symptoms-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 id="symptoms-modal-title" className="text-sm font-bold text-slate-900">
                {isEn ? 'Report Subjective Symptoms' : 'Reportar Síntomas del Astronauta'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEn
                  ? 'Cross-checked against sensors to rule out organic mimics.'
                  : 'Se cruza con tus sensores para descartar imitadores orgánicos.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Cerrar'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.flank_pain}
              onChange={(e) => setForm((p) => ({ ...p, flank_pain: e.target.checked }))}
              className="mt-0.5 rounded border-slate-300 text-sky-600"
            />
            <div>
              <span className="block text-xs font-semibold text-slate-900">
                {isEn ? 'Flank / Lumbar Pain' : 'Dolor lumbar o en flanco'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {isEn ? 'Triggers renal stone POCUS protocol.' : 'Activa protocolo POCUS de litiasis renal.'}
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pocus_dvt_suspicion}
              onChange={(e) => setForm((p) => ({ ...p, pocus_dvt_suspicion: e.target.checked }))}
              className="mt-0.5 rounded border-slate-300 text-sky-600"
            />
            <div>
              <span className="block text-xs font-semibold text-slate-900">
                {isEn ? 'Neck / Limb Swelling or Pain (DVT Suspicion)' : 'Edema / dolor cervical yugular o en pierna (TVP)'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {isEn ? 'Locks LBNP & triggers jugular/deep POCUS.' : 'Bloquea LBNP y exige POCUS venoso compresivo.'}
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ecg_arrhythmia_detected}
              onChange={(e) => setForm((p) => ({ ...p, ecg_arrhythmia_detected: e.target.checked }))}
              className="mt-0.5 rounded border-slate-300 text-sky-600"
            />
            <div>
              <span className="block text-xs font-semibold text-slate-900">
                {isEn ? 'Palpitations / Arrhythmia' : 'Palpitaciones / arritmia percibida'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {isEn ? 'Flags cardiac thorax alert & locks LBNP.' : 'Marca alerta cardíaca y bloquea LBNP por seguridad.'}
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.skin_rash_or_viral_symptoms}
              onChange={(e) =>
                setForm((p) => ({ ...p, skin_rash_or_viral_symptoms: e.target.checked }))
              }
              className="mt-0.5 rounded border-slate-300 text-sky-600"
            />
            <div>
              <span className="block text-xs font-semibold text-slate-900">
                {isEn ? 'Skin Rash / Viral Prodrome' : 'Erupción cutánea o síntomas virales'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {isEn ? 'Flags latent viral reactivation / immune stress.' : 'Alerta de reactivación viral / estrés inmune.'}
              </span>
            </div>
          </label>

          <div className="p-2.5 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_emesis}
                onChange={(e) => setForm((p) => ({ ...p, has_emesis: e.target.checked }))}
                className="mt-0.5 rounded border-slate-300 text-sky-600"
              />
              <div>
                <span className="block text-xs font-semibold text-slate-900">
                  {isEn ? 'Post-SPE Nausea / Emesis (Prodromal)' : 'Náusea / vómito post-tormenta solar (SPE)'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {isEn ? 'Biological dosimetry marker (< 2–4 h triggers CBC).' : 'Marcador de dosimetría biológica (< 2–4 h activa BH seriada).'}
                </span>
              </div>
            </label>
            {form.has_emesis && (
              <label className="flex items-center justify-between gap-2 pl-6 text-xs text-slate-700">
                <span>{isEn ? 'Time to emesis (hours):' : 'Tiempo a emesis (horas):'}</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="24"
                  value={form.time_to_emesis_hours}
                  onChange={(e) => setForm((p) => ({ ...p, time_to_emesis_hours: e.target.value }))}
                  className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200"
                />
              </label>
            )}
          </div>

          <div className="space-y-3 pt-1">
            <label className="block">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>{isEn ? 'Perceived Stress / Anxiety (VAS 1-10)' : 'Estrés / Ansiedad percibida (VAS 1-10)'}</span>
                <strong className="text-sky-700">{form.anxiety_vas}/10</strong>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.anxiety_vas}
                onChange={(e) => setForm((p) => ({ ...p, anxiety_vas: Number(e.target.value) }))}
                className="w-full mt-1.5 accent-sky-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">GAD-2 (0–6)</span>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={form.gad2_score}
                  onChange={(e) => setForm((p) => ({ ...p, gad2_score: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <span className="block text-[10px] text-slate-500 mt-1 leading-tight">
                  {isEn
                    ? 'Sum 2 items (nervous + inability to stop worrying): 0–3 each; ≥ 3 screen+'
                    : 'Suma 2 ítems (nerviosismo + no parar de preocuparse): 0–3 c/u; ≥ 3 positivo'}
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">
                  {isEn ? 'Sleep (hours)' : 'Sueño (horas)'}
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="14"
                  value={form.sleep_hours}
                  onChange={(e) => setForm((p) => ({ ...p, sleep_hours: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
            >
              {isEn ? 'Evaluate Symptoms' : 'Evaluar Síntomas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
