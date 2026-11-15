import React, { useState, useEffect } from 'react';
import { Earth, ShieldAlert, X } from 'lucide-react';

const AVAILABLE_MEDS = [
  { id: 'Complejo B', es: 'Complejo B', en: 'Vitamin B-Complex' },
  { id: 'Alendronato 70 mg/sem', es: 'Alendronato 70 mg/sem', en: 'Alendronate 70 mg/wk' },
  { id: 'Citrato de potasio', es: 'Citrato de potasio', en: 'Potassium Citrate' },
  { id: 'Vitamina D3', es: 'Vitamina D3', en: 'Vitamin D3' },
];

export default function BaselineModal({ isOpen, initialProfile, lang = 'es', onSave, onClose }) {
  const isEn = lang === 'en';
  const [form, setForm] = useState(initialProfile || {});
  const [activeTab, setActiveTab] = useState('id');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (initialProfile) {
      setForm(initialProfile);
    }
    if (isOpen) {
      setActiveTab('id');
      setSaveError(null);
    }
  }, [initialProfile, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const TABS = [
    { id: 'id', label: isEn ? '1. Crew ID & Meds' : '1. Identificación' },
    { id: 'baseline', label: isEn ? '2. Earth Baseline' : '2. Línea Base (Tierra)' },
    { id: 'waivers', label: isEn ? '3. Clinical Waivers' : '3. Precauciones Clínicas' },
  ];

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const nowLocal = new Date();
  const todayLocalIso = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(
    nowLocal.getDate()
  ).padStart(2, '0')}`;

  const handleBirthDateChange = (iso) => {
    if (!iso) {
      updateField('birth_date', iso);
      return;
    }
    const today = new Date();
    const b = new Date(`${iso}T00:00:00`);
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
      age -= 1;
    }
    setForm((prev) => ({ ...prev, birth_date: iso, age: Math.max(0, age) }));
  };

  const handleMissionDayChange = (val) => {
    const days = Math.max(0, Number(val || 0));
    const d = new Date();
    d.setDate(d.getDate() - days);
    const launchIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
      2,
      '0'
    )}`;
    setForm((prev) => ({ ...prev, mission_day: val, launch_date: launchIso }));
  };

  const handleLaunchDateChange = (iso) => {
    if (!iso) {
      updateField('launch_date', iso);
      return;
    }
    const diffMs = new Date(`${todayLocalIso}T00:00:00`) - new Date(`${iso}T00:00:00`);
    const days = Math.max(0, Math.floor(diffMs / 86400000));
    setForm((prev) => ({ ...prev, launch_date: iso, mission_day: days }));
  };

  const toggleMed = (med) => {
    const current = form.active_meds || [];
    if (current.includes(med)) {
      updateField(
        'active_meds',
        current.filter((m) => m !== med)
      );
    } else {
      updateField('active_meds', [...current, med]);
    }
  };

  const weight = Number(form.weight_kg || 72);
  const heightM = Number(form.height_cm || 175) / 100;
  const bmi = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : '—';

  const numOr = (val, fallback) => (val === '' || val === null || val === undefined ? fallback : Number(val));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const refr = numOr(form.baseline_refraction_diopters, initialProfile?.baseline_refraction_diopters ?? 0);
    if (Number.isNaN(refr) || refr < -5.5 || refr > 5.5) {
      setSaveError(
        isEn
          ? 'Baseline refraction must be within [-5.50, +5.50] D per aerospace standards.'
          : 'La refracción basal debe estar entre -5.50 y +5.50 D.'
      );
      setActiveTab('waivers');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        age: numOr(form.age, initialProfile?.age ?? 26),
        weight_kg: numOr(form.weight_kg, initialProfile?.weight_kg ?? 72),
        height_cm: numOr(form.height_cm, initialProfile?.height_cm ?? 175),
        mission_day: numOr(form.mission_day, initialProfile?.mission_day ?? 26),
        baseline_refraction_diopters: refr,
        hr_baseline_bpm: numOr(form.hr_baseline_bpm, initialProfile?.hr_baseline_bpm ?? 64),
        hrv_baseline_ms: numOr(form.hrv_baseline_ms, initialProfile?.hrv_baseline_ms ?? 48),
        systolic_bp_baseline: numOr(form.systolic_bp_baseline, initialProfile?.systolic_bp_baseline ?? 115),
        diastolic_bp_baseline: numOr(form.diastolic_bp_baseline, initialProfile?.diastolic_bp_baseline ?? 74),
        onsd_baseline_mm: numOr(form.onsd_baseline_mm, initialProfile?.onsd_baseline_mm ?? 4.2),
        iop_baseline_mmhg: numOr(form.iop_baseline_mmhg, initialProfile?.iop_baseline_mmhg ?? 14),
        oct_trt250_baseline_um: numOr(form.oct_trt250_baseline_um, initialProfile?.oct_trt250_baseline_um ?? 340),
        bmd_tscore_baseline: numOr(form.bmd_tscore_baseline, initialProfile?.bmd_tscore_baseline ?? 0.2),
        pvt_baseline_ms: numOr(form.pvt_baseline_ms, initialProfile?.pvt_baseline_ms ?? 235),
        alc_baseline_cells_ul: numOr(form.alc_baseline_cells_ul, initialProfile?.alc_baseline_cells_ul ?? 2100),
        prior_career_rad_msv: numOr(form.prior_career_rad_msv, initialProfile?.prior_career_rad_msv ?? 18),
      });
      onClose();
    } catch (err) {
      setSaveError(err.message || (isEn ? 'Failed to save baseline profile.' : 'Error al guardar la línea base.'));
    } finally {
      setSaving(false);
    }
  };

  const activeWaiversCount =
    (form.amb_waiver_orthostatic_or_arrhythmia ? 1 : 0) + (form.amb_waiver_renal ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="baseline-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-[94vw] h-[84vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Cabecera Fija */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-7 pt-6 pb-0 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0b3d91] flex items-center justify-center text-white shadow-sm shrink-0">
                <svg
                  viewBox="0 0 36 36"
                  className="w-9 h-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="18" cy="17" r="9.5" />
                  <path d="M8.5 14.5H7a1.5 1.5 0 0 0-1.5 1.5v2A1.5 1.5 0 0 0 7 19.5h1.5" />
                  <path d="M27.5 14.5H29a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 29 19.5h-1.5" />
                  <path d="M10.5 24.5c1.8 3.2 13.2 3.2 15 0" />
                  <rect x="11" y="11.5" width="14" height="10.5" rx="5.2" />
                  <path
                    d="M20.2 13.8h1.6v1.4h1.4v1.6h-1.4v1.4h-1.6v-1.4h-1.4v-1.6h1.4v-1.4z"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </div>
              <div>
                <h2 id="baseline-modal-title" className="text-base font-bold text-slate-900">
                  {isEn ? 'Crew ID & Personal Earth Baseline' : 'Ficha de Identificación y Línea Base Personal'}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isEn
                    ? 'Clinical astronaut profile and pre-flight reference baselines on Earth'
                    : 'Perfil clínico del tripulante y valores de referencia en Tierra'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close' : 'Cerrar'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Pestañas Limpias */}
          <div className="flex items-center gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'border-[#0284c7] text-[#0284c7]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'waivers' && activeWaiversCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                      {activeWaiversCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {saveError && (
          <div className="mx-7 mt-3 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {saveError}
          </div>
        )}

        {/* Formulario con Cuerpo Desplazable Limpio + Pie Fijo */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-7 sm:p-8">
            {activeTab === 'id' && (
              <section className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Callsign / Name' : 'Callsign / Nombre'}
                    <input
                      type="text"
                      value={form.callsign || ''}
                      onChange={(e) => updateField('callsign', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-500 outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700 sm:col-span-2">
                    {isEn ? 'Crew Role' : 'Rol en Tripulación'}
                    <input
                      type="text"
                      value={form.role || ''}
                      onChange={(e) => updateField('role', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-500 outline-none"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Birth Date' : 'Fecha de Nacimiento'}
                    <input
                      type="date"
                      value={form.birth_date ?? '2000-05-15'}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                  <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    <span>{isEn ? 'Calculated Age' : 'Edad Calculada'}</span>
                    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-800 text-sm font-semibold">
                      {form.age ?? 26} {isEn ? 'yrs' : 'años'}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Biological Sex' : 'Sexo Biológico'}
                    <select
                      value={form.sex || 'M'}
                      onChange={(e) => updateField('sex', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    >
                      <option value="M">{isEn ? 'Male (M)' : 'Masculino (M)'}</option>
                      <option value="F">{isEn ? 'Female (F)' : 'Femenino (F)'}</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Blood Type' : 'Tipo de Sangre'}
                    <select
                      value={form.blood_type || 'O+'}
                      onChange={(e) => updateField('blood_type', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Weight (kg)' : 'Peso (kg)'}
                    <input
                      type="number"
                      step="any"
                      min="40"
                      max="150"
                      value={form.weight_kg ?? 72}
                      onChange={(e) => updateField('weight_kg', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Height (cm)' : 'Estatura (cm)'}
                    <input
                      type="number"
                      step="any"
                      min="140"
                      max="210"
                      value={form.height_cm ?? 175}
                      onChange={(e) => updateField('height_cm', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                  <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    <span>{isEn ? 'Calculated BMI (kg/m²)' : 'IMC Calculado (kg/m²)'}</span>
                    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-800 text-sm font-semibold">
                      {bmi} kg/m²
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Launch Date (FD0)' : 'Fecha de Despegue (FD0)'}
                    <input
                      type="date"
                      value={form.launch_date ?? todayLocalIso}
                      onChange={(e) => handleLaunchDateChange(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Current Mission Day' : 'Día de Misión Actual'}
                    <input
                      type="number"
                      min="0"
                      max="1500"
                      value={form.mission_day ?? 26}
                      onChange={(e) => handleMissionDayChange(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Known Allergies' : 'Alergias Conocidas'}
                    <input
                      type="text"
                      value={form.allergies ?? (isEn ? 'None' : 'Ninguna')}
                      placeholder={isEn ? 'None' : 'Ninguna'}
                      onChange={(e) => updateField('allergies', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <span className="text-xs font-medium text-slate-700">
                    {isEn ? 'Prophylaxis / Active Onboard Medication' : 'Profilaxis / Medicación Activa a Bordo'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_MEDS.map((med) => {
                      const active = (form.active_meds || []).includes(med.id);
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => toggleMed(med.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {isEn ? med.en : med.es}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'baseline' && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 pb-1">
                  <Earth className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {isEn
                      ? 'Pre-flight Earth measurements used as reference to quantify microgravity drift.'
                      : 'Valores medidos en Tierra antes del despegue. Sirven para detectar cambios relativos en órbita.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Heart Rate (bpm)' : 'Frecuencia Cardíaca (FC lpm)'}
                    <input
                      type="number"
                      step="any"
                      value={form.hr_baseline_bpm ?? 64}
                      onChange={(e) => updateField('hr_baseline_bpm', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 50 – 80 {isEn ? 'bpm' : 'lpm'}</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Heart Rate Variability (HRV ms)' : 'Variabilidad Cardíaca (HRV ms)'}
                    <input
                      type="number"
                      step="any"
                      value={form.hrv_baseline_ms ?? 48}
                      onChange={(e) => updateField('hrv_baseline_ms', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 30 – 80 ms (RMSSD)</span>
                  </label>

                  <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    <span>{isEn ? 'Blood Pressure (SBP / DBP mmHg)' : 'Presión Arterial (PAS / PAD mmHg)'}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={form.systolic_bp_baseline ?? 115}
                        onChange={(e) => updateField('systolic_bp_baseline', e.target.value)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                      />
                      <span className="text-slate-500">/</span>
                      <input
                        type="number"
                        step="any"
                        value={form.diastolic_bp_baseline ?? 74}
                        onChange={(e) => updateField('diastolic_bp_baseline', e.target.value)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Ref: 100–125 / 60–80 mmHg</span>
                  </div>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Optic Nerve Sheath (ONSD mm)' : 'Vaina del Nervio Óptico (ONSD mm)'}
                    <input
                      type="number"
                      step="any"
                      value={form.onsd_baseline_mm ?? 4.2}
                      onChange={(e) => updateField('onsd_baseline_mm', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 3.8 – 4.8 mm</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Intraocular Pressure (IOP mmHg)' : 'Presión Intraocular (IOP mmHg)'}
                    <input
                      type="number"
                      step="any"
                      value={form.iop_baseline_mmhg ?? 14}
                      onChange={(e) => updateField('iop_baseline_mmhg', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 12 – 16 mmHg (&gt; 21 alert)</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Macular Peripapillary OCT (TRT250 µm)' : 'Espesor Retiniano OCT (TRT250 µm)'}
                    <input
                      type="number"
                      step="any"
                      value={form.oct_trt250_baseline_um ?? 340}
                      onChange={(e) => updateField('oct_trt250_baseline_um', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 300 – 380 µm (ΔTRT250 ≥ 20 / ≥ 55)</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Bone Mineral Density (T-score)' : 'Densidad Mineral Ósea (T-score)'}
                    <input
                      type="number"
                      step="any"
                      value={form.bmd_tscore_baseline ?? 0.2}
                      onChange={(e) => updateField('bmd_tscore_baseline', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: &gt; -1.0 (Wolff)</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Reaction Time (PVT-B ms)' : 'Tiempo de Reacción (PVT-B ms)'}
                    <input
                      type="number"
                      step="any"
                      value={form.pvt_baseline_ms ?? 235}
                      onChange={(e) => updateField('pvt_baseline_ms', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 210 – 260 ms (Lapse ≥ 355)</span>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                    {isEn ? 'Baseline Lymphocytes (ALC cells/µL)' : 'Linfocitos Basales (ALC cél/µL)'}
                    <input
                      type="number"
                      step="any"
                      value={form.alc_baseline_cells_ul ?? 2100}
                      onChange={(e) => updateField('alc_baseline_cells_ul', e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Ref: 1,500 – 3,500 /µL</span>
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 max-w-xs">
                  {isEn ? 'Prior Career Radiation Dose (mSv)' : 'Radiación Acumulada Previa en Carrera (mSv)'}
                  <input
                    type="number"
                    step="any"
                    value={form.prior_career_rad_msv ?? 18}
                    onChange={(e) => updateField('prior_career_rad_msv', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm"
                  />
                  <span className="text-[10px] text-slate-500">NASA-STD-3001 Career Limit: 600 mSv</span>
                </label>
              </section>
            )}

            {activeTab === 'waivers' && (
              <section className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 pb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {isEn
                      ? 'Official medical waivers (OCHMO). Enabling them activates automatic safety interlocks in orbit.'
                      : 'Exenciones médicas oficiales (Waivers OCHMO) en tripulantes sanos. Activan candados preventivos automáticos en órbita.'}
                  </span>
                </div>

                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.amb_waiver_orthostatic_or_arrhythmia
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.amb_waiver_orthostatic_or_arrhythmia)}
                    onChange={(e) => updateField('amb_waiver_orthostatic_or_arrhythmia', e.target.checked)}
                    className="mt-0.5"
                  />
                  <div className="text-xs flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {isEn
                          ? 'History of vasovagal syncope or benign arrhythmia (Waiver)'
                          : 'Antecedente de síncope vasovagal o arritmia benigna (Waiver)'}
                      </span>
                      {form.amb_waiver_orthostatic_or_arrhythmia && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {isEn ? 'LBNP Interlock Active' : 'Candado LBNP Activo'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {isEn
                        ? 'Locks LBNP suction chamber automatically to prevent preload drop and substitutes Thigh Cuffs (30–50 mmHg). Also excludes LBNP in-flight if DVT, hypovolemia, or acute arrhythmia appear.'
                        : 'Bloquea automáticamente el pantalón de succión LBNP por riesgo de caída de precarga y lo sustituye por Thigh Cuffs (30–50 mmHg). En vuelo también se bloquea ante TVP, hipovolemia o arritmia.'}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.amb_waiver_renal
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.amb_waiver_renal)}
                    onChange={(e) => updateField('amb_waiver_renal', e.target.checked)}
                    className="mt-0.5"
                  />
                  <div className="text-xs flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {isEn
                          ? 'History of resolved single renal stone (Waiver)'
                          : 'Antecedente de cálculo renal único resuelto (Waiver)'}
                      </span>
                      {form.amb_waiver_renal && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {isEn ? 'Strict Threshold (1.25x)' : 'Umbral Estricto (1.25x)'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {isEn
                        ? 'Lowers urinary calcium supersaturation alert threshold due to bone resorption and low fluid intake in 0g.'
                        : 'Vuelve más estricto el índice de sobresaturación cálcica urinaria por resorción ósea y baja hidratación en 0g.'}
                    </p>
                  </div>
                </label>

                <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form.uses_glasses)}
                      onChange={(e) => updateField('uses_glasses', e.target.checked)}
                    />
                    <span>{isEn ? 'Uses corrective lenses (SANS reference)' : 'Usa lentes / graduación previa (Referencia SANS)'}</span>
                  </label>
                  {form.uses_glasses && (
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      {isEn ? 'Baseline diopters (std -5.50 to +5.50 D):' : 'Dioptrías basales (estándar -5.50 a +5.50 D):'}
                      <input
                        type="number"
                        step="any"
                        min="-15"
                        max="15"
                        value={form.baseline_refraction_diopters ?? 0}
                        onChange={(e) => updateField('baseline_refraction_diopters', e.target.value)}
                        className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                      />
                    </label>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Pie Fijo */}
          <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeTab !== 'id' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'waivers' ? 'baseline' : 'id')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  ← {isEn ? 'Previous' : 'Anterior'}
                </button>
              )}
              {activeTab !== 'waivers' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'id' ? 'baseline' : 'waivers')}
                  className="px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer"
                >
                  {isEn ? 'Next' : 'Siguiente'} →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {saving
                  ? isEn
                    ? 'Saving...'
                    : 'Guardando...'
                  : isEn
                  ? 'Save Baseline & Enter'
                  : 'Guardar Línea Base y Entrar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
