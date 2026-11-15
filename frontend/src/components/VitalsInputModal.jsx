import React, { useEffect, useRef, useState } from 'react';
import { Activity, X } from 'lucide-react';

export default function VitalsInputModal({ isOpen, telemetry = {}, lang = 'es', onClose, onApplyResult }) {
  const isEn = lang === 'en';
  const wasOpenRef = useRef(false);

  const [form, setForm] = useState({
    onsd_measured_mm: '',
    oct_trt250_delta_um: '',
    iop_mmhg: '',
    glucose_mg_dl: '',
    water_intake_liters: '',
    urine_output_liters: '',
    urine_specific_gravity: '',
    cabin_ppco2_mmhg: '',
    cabin_noise_dba: '',
    spo2_percent: '',
    heart_rate_bpm: '',
    systolic_bp: '',
    diastolic_bp: '',
    spe_event_dose_mgyeq: '',
    ionized_calcium_mmol_l: '',
  });

  // Inicializar solo en transición cerrado -> abierto para no pisar la edición mientras llegan ticks live
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && telemetry) {
      setForm({
        onsd_measured_mm: telemetry.onsd_measured_mm ?? 4.3,
        oct_trt250_delta_um: telemetry.oct_trt250_delta_um ?? 8,
        iop_mmhg: telemetry.iop_mmhg ?? 15,
        glucose_mg_dl: telemetry.glucose_mg_dl ?? 92,
        water_intake_liters: telemetry.water_intake_liters ?? 2.4,
        urine_output_liters: telemetry.urine_output_liters ?? 1.8,
        urine_specific_gravity: telemetry.urine_specific_gravity ?? 1.012,
        cabin_ppco2_mmhg: telemetry.cabin_ppco2_mmhg ?? 2.1,
        cabin_noise_dba: telemetry.cabin_noise_dba ?? 55,
        spo2_percent: telemetry.spo2_percent ?? 98,
        heart_rate_bpm: telemetry.heart_rate_bpm ?? 68,
        systolic_bp: telemetry.systolic_bp ?? 118,
        diastolic_bp: telemetry.diastolic_bp ?? 76,
        spe_event_dose_mgyeq: telemetry.spe_event_dose_mgyeq ?? 0,
        ionized_calcium_mmol_l: telemetry.ionized_calcium_mmol_l ?? 1.22,
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

  const setNum = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const numOr = (val, fallback) => (val === '' || val === null || val === undefined ? fallback : Number(val));

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyResult({
      onsd_measured_mm: numOr(form.onsd_measured_mm, telemetry.onsd_measured_mm ?? 4.3),
      oct_trt250_delta_um: numOr(form.oct_trt250_delta_um, telemetry.oct_trt250_delta_um ?? 8),
      iop_mmhg: numOr(form.iop_mmhg, telemetry.iop_mmhg ?? 15),
      glucose_mg_dl: numOr(form.glucose_mg_dl, telemetry.glucose_mg_dl ?? 92),
      water_intake_liters: numOr(form.water_intake_liters, telemetry.water_intake_liters ?? 2.4),
      urine_output_liters: numOr(form.urine_output_liters, telemetry.urine_output_liters ?? 1.8),
      urine_specific_gravity: numOr(form.urine_specific_gravity, telemetry.urine_specific_gravity ?? 1.012),
      cabin_ppco2_mmhg: numOr(form.cabin_ppco2_mmhg, telemetry.cabin_ppco2_mmhg ?? 2.1),
      cabin_noise_dba: numOr(form.cabin_noise_dba, telemetry.cabin_noise_dba ?? 55),
      spo2_percent: numOr(form.spo2_percent, telemetry.spo2_percent ?? 98),
      heart_rate_bpm: numOr(form.heart_rate_bpm, telemetry.heart_rate_bpm ?? 68),
      systolic_bp: numOr(form.systolic_bp, telemetry.systolic_bp ?? 118),
      diastolic_bp: numOr(form.diastolic_bp, telemetry.diastolic_bp ?? 76),
      spe_event_dose_mgyeq: numOr(form.spe_event_dose_mgyeq, telemetry.spe_event_dose_mgyeq ?? 0),
      ionized_calcium_mmol_l: numOr(form.ionized_calcium_mmol_l, telemetry.ionized_calcium_mmol_l ?? 1.22),
    });
    onClose();
  };

  const fieldsGroup1 = [
    { key: 'onsd_measured_mm', label: isEn ? 'Ocular ONSD (mm)' : 'ONSD Ocular (mm)', step: '0.1', min: 2.0, max: 9.0 },
    { key: 'oct_trt250_delta_um', label: 'OCT ΔTRT250 (µm)', step: '1', min: -30, max: 200 },
    { key: 'iop_mmhg', label: isEn ? 'Intraocular Press. IOP (mmHg)' : 'Presión Ocular IOP (mmHg)', step: '1', min: 5, max: 50 },
    { key: 'glucose_mg_dl', label: isEn ? 'Capillary Glucose (mg/dL)' : 'Glucosa Capilar (mg/dL)', step: '1', min: 20, max: 600 },
    { key: 'ionized_calcium_mmol_l', label: 'iCa²⁺ i-STAT (mmol/L)', step: '0.01', min: 0.6, max: 2.0 },
    { key: 'water_intake_liters', label: isEn ? '24h Hydration (L)' : 'Hidratación 24h (L)', step: '0.1', min: 0, max: 6 },
    { key: 'urine_output_liters', label: isEn ? '24h Urine Output (L)' : 'Diuresis 24h (L)', step: '0.1', min: 0, max: 5 },
    { key: 'urine_specific_gravity', label: isEn ? 'Urine Specific Gravity' : 'Densidad Urinaria (SG)', step: '0.001', min: 1.0, max: 1.045 },
  ];

  const fieldsGroup2 = [
    { key: 'cabin_ppco2_mmhg', label: isEn ? 'Cabin ppCO₂ (mmHg)' : 'ppCO₂ Cabina (mmHg)', step: '0.1', min: 0, max: 25 },
    { key: 'cabin_noise_dba', label: isEn ? 'Cabin Noise (dBA)' : 'Ruido Cabina (dBA)', step: '1', min: 30, max: 110 },
    { key: 'spo2_percent', label: 'SpO₂ (%)', step: '1', min: 50, max: 100 },
    { key: 'heart_rate_bpm', label: isEn ? 'Heart Rate (bpm)' : 'Frec. Cardíaca (lpm)', step: '1', min: 25, max: 220 },
    { key: 'systolic_bp', label: isEn ? 'Systolic BP (mmHg)' : 'Presión Sistólica PAS (mmHg)', step: '1', min: 50, max: 240 },
    { key: 'diastolic_bp', label: isEn ? 'Diastolic BP (mmHg)' : 'Presión Diastólica PAD (mmHg)', step: '1', min: 30, max: 150 },
    { key: 'spe_event_dose_mgyeq', label: isEn ? 'SPE Event Dose (mGy-Eq)' : 'Dosis SPE Evento (mGy-Eq)', step: '1', min: 0, max: 5000 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vitals-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 id="vitals-modal-title" className="text-sm font-bold text-slate-900">
                {isEn ? 'Log Clinical Measurement' : 'Registrar Medición Clínica'}
              </h2>
              <p className="text-xs text-slate-600">
                {isEn
                  ? 'Persists a validated reading to local storage and updates the body map.'
                  : 'Guarda una nueva lectura validada en almacenamiento local y recalcula el mapa al instante.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Cerrar'}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              {isEn ? 'Spot Kit Readings (POCUS / OCT / i-STAT / Tonometer)' : 'Mediciones de Botiquín (POCUS / OCT / i-STAT / Tonómetro)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fieldsGroup1.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-slate-700">{f.label}</span>
                  <input
                    type="number"
                    step="any"
                    min={f.min}
                    max={f.max}
                    value={form[f.key]}
                    onChange={(e) => setNum(f.key, e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              {isEn ? 'Passive Sensors & Environmental Override' : 'Sensores Pasivos y Ambiente (Ajuste Manual)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fieldsGroup2.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-slate-700">{f.label}</span>
                  <input
                    type="number"
                    step="any"
                    min={f.min}
                    max={f.max}
                    value={form[f.key]}
                    onChange={(e) => setNum(f.key, e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </label>
              ))}
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
              {isEn ? 'Save & Evaluate' : 'Guardar y Evaluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
