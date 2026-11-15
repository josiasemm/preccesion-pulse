import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  RotateCcw,
  X,
} from 'lucide-react';
import ProtocolSvgIllustration from './ProtocolSvgIllustration';

const SHORT_LABELS = {
  es: {
    pocus_onsd: 'POCUS Ocular (ONSD)',
    pocus_dvt: 'POCUS TVP Yugular',
    pcba_istat: 'Analítica i-STAT',
    lbnp_safety: 'Seguridad LBNP',
    abcde_0g_fast: 'ABCDE 0g + FAST',
    spe_storm_shelter: 'Refugio Tormenta SPE',
    renal_stone_pocus: 'POCUS Litiasis Renal',
    fluid_loading_reentry: 'Carga Hídrica Reentrada',
    eva_dcs_hypoxia: 'EVA · Hipoxia / DCS',
    thigh_cuff_sans: 'Brazaletes SANS',
  },
  en: {
    pocus_onsd: 'Ocular POCUS (ONSD)',
    pocus_dvt: 'Jugular DVT POCUS',
    pcba_istat: 'i-STAT Panel',
    lbnp_safety: 'LBNP Safety',
    abcde_0g_fast: '0g ABCDE + FAST',
    spe_storm_shelter: 'SPE Storm Shelter',
    renal_stone_pocus: 'Renal Stone POCUS',
    fluid_loading_reentry: 'Re-entry Fluid Loading',
    eva_dcs_hypoxia: 'EVA · Hypoxia / DCS',
    thigh_cuff_sans: 'SANS Thigh Cuffs',
  },
};

const LBNP_LOCK_LABELS = {
  es: {
    dvt_suspicion: 'Sospecha TVP',
    hypovolemia_or_dehydration: 'Hipovolemia / baja ingesta o PAS < 95',
    arrhythmia_or_syncope_waiver: 'Arritmia ECG o waiver ortostático',
    hypoglycemia_syncope_risk: 'Hipoglucemia (< 70 mg/dL)',
    dehydration_low_intake: 'Ingesta hídrica < 1.5 L',
    concentrated_urine_sg: 'Densidad urinaria ≥ 1.020',
    hypotension_sbp_lt_95: 'Hipotensión (PAS < 95)',
    ecg_arrhythmia: 'Arritmia en ECG',
    orthostatic_waiver: 'Waiver ortostático/arritmia',
  },
  en: {
    dvt_suspicion: 'DVT suspicion',
    hypovolemia_or_dehydration: 'Hypovolemia / dehydration or SBP < 95',
    arrhythmia_or_syncope_waiver: 'ECG arrhythmia or orthostatic waiver',
    hypoglycemia_syncope_risk: 'Hypoglycemia (< 70 mg/dL)',
    dehydration_low_intake: 'Low intake < 1.5 L',
    concentrated_urine_sg: 'Urine SG ≥ 1.020',
    hypotension_sbp_lt_95: 'Hypotension (SBP < 95)',
    ecg_arrhythmia: 'ECG arrhythmia',
    orthostatic_waiver: 'Orthostatic/arrhythmia waiver',
  },
};

export default function ProtocolModal({
  isOpen,
  protocols = {},
  initialProtocolId,
  evaluation = null,
  telemetry = {},
  environment = null,
  sessionKey = 'live',
  lang = 'es',
  onClose,
}) {
  const keys = Object.keys(protocols);
  const [selectedId, setSelectedId] = useState(initialProtocolId || keys[0] || 'pocus_onsd');
  const [stepIdx, setStepIdx] = useState(0);
  const [showThresholds, setShowThresholds] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('eimo_protocol_steps_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const stepBucketKey = `${sessionKey}::${selectedId}`;

  const setStepDone = (protoId, idx, value) => {
    const bucket = `${sessionKey}::${protoId}`;
    setCheckedSteps((prev) => {
      const cur = prev[bucket] || {};
      const next = {
        ...prev,
        [bucket]: { ...cur, [idx]: value },
      };
      try {
        localStorage.setItem('eimo_protocol_steps_v2', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const resetSteps = (protoId) => {
    const bucket = `${sessionKey}::${protoId}`;
    setCheckedSteps((prev) => {
      const next = { ...prev, [bucket]: {} };
      try {
        localStorage.setItem('eimo_protocol_steps_v2', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setStepIdx(0);
  };

  useEffect(() => {
    if (initialProtocolId && protocols[initialProtocolId]) {
      setSelectedId(initialProtocolId);
      setStepIdx(0);
      setShowThresholds(false);
    } else if (!protocols[selectedId] && keys.length) {
      setSelectedId(keys[0]);
      setStepIdx(0);
      setShowThresholds(false);
    }
  }, [initialProtocolId, protocols, isOpen]);

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
  const proto = protocols[selectedId];
  const steps = proto?.steps || [];
  const safeIdx = Math.min(stepIdx, Math.max(0, steps.length - 1));
  const currentStepText = steps[safeIdx] || '';
  const completedCount = Object.values(checkedSteps[stepBucketKey] || {}).filter(Boolean).length;
  const isCurrentDone = Boolean(checkedSteps[stepBucketKey]?.[safeIdx]);

  const deviceLabel = proto?.device || proto?.required_hardware || 'Medical Kit';
  const riskDomainLabel = proto?.risk_domain || proto?.hazard || '—';
  const rationaleText = proto?.clinical_rationale || proto?.why_needed || '';
  const thresholdsObj = proto?.decision_thresholds || proto?.thresholds || null;

  const hydro = evaluation?.models?.hydrostatics_and_fluids || {};
  const hw = environment?.available_hardware || [];
  const lockWarnings = [];

  if (selectedId === 'lbnp_safety' && hydro.lbnp_safe === false) {
    const lockMap = LBNP_LOCK_LABELS[isEn ? 'en' : 'es'];
    const activeLockKeys = (
      Array.isArray(hydro.lbnp_locks)
        ? hydro.lbnp_locks
        : Object.entries(hydro.lbnp_locks || {})
            .filter(([, active]) => Boolean(active))
            .map(([key]) => key)
    ).map((k) => lockMap[k] || k);
    const exactLocks = activeLockKeys.length
      ? `: ${activeLockKeys.join(', ')}`
      : isEn
      ? ' (rule out DVT, hypovolemia, arrhythmia, or prior syncope)'
      : ' (descartar TVP, hipovolemia, arritmia o síncope previo)';
    lockWarnings.push(
      isEn ? `LBNP LOCKED by safety interlock${exactLocks}.` : `LBNP BLOQUEADO por candado de seguridad${exactLocks}.`
    );
  }
  const octDelta =
    telemetry?.oct_trt250_delta_um != null && telemetry?.oct_trt250_delta_um !== 4
      ? telemetry.oct_trt250_delta_um
      : telemetry?.oct_rnfl_delta_um != null
      ? Math.round(telemetry.oct_rnfl_delta_um * 3.65 * 10) / 10
      : telemetry?.oct_trt250_delta_um ?? 0;
  if (
    selectedId === 'fluid_loading_reentry' &&
    (hydro.sans_risk === 'critical' ||
      (telemetry?.onsd_measured_mm ?? 0) >= 5.8 ||
      octDelta >= 55 ||
      (telemetry?.amsler_distortions ?? 0) > 0 ||
      (telemetry?.systolic_bp ?? 118) >= 150)
  ) {
    lockWarnings.push(
      isEn
        ? 'Relative contraindication (active severe SANS or SBP ≥ 150 mmHg): avoid acute NaCl load without Flight Surgeon authorization.'
        : 'Contraindicación relativa (SANS severo activo o PAS ≥ 150 mmHg): evitar sobrecarga aguda de NaCl sin autorización del Flight Surgeon.'
    );
  }

  // Verificación de hardware SWaP disponible para el protocolo seleccionado
  if (hw.length > 0) {
    const hwRequirements = {
      pocus_onsd: 'Ultrasound-2',
      pocus_dvt: 'Ultrasound-2',
      renal_stone_pocus: 'Ultrasound-2',
      pcba_istat: 'PCBA',
      lbnp_safety: 'LBNP',
      spe_storm_shelter: 'Storm Shelter',
      fluid_loading_reentry: 'OIG',
      abcde_0g_fast: 'DEA',
      thigh_cuff_sans: 'Thigh Cuffs',
    };
    const reqToken = hwRequirements[selectedId];
    if (reqToken && !hw.some((item) => item.toLowerCase().includes(reqToken.toLowerCase()))) {
      lockWarnings.push(
        isEn
          ? `Required SWaP hardware (${reqToken}) unavailable in ${environment?.name || 'current vehicle'}. Use Earth MCC contingency / alternate SOP.`
          : `Hardware SWaP requerido (${reqToken}) no disponible en ${environment?.name || 'vehículo actual'}. Usar contingencia MCC / protocolo alterno.`
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="protocol-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl h-[85vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <div>
              <h2 id="protocol-modal-title" className="text-base font-bold text-slate-900">
                {isEn ? 'Microgravity (0g) Procedures Manual' : 'Manual de Procedimientos en Microgravedad (0g)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEn ? 'Step-by-step guided execution for CMO under stress' : 'Ejecución guiada paso a paso para CMO en órbita'}
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

        {/* Selector de protocolos */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap gap-1.5 shrink-0">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setSelectedId(k);
                setStepIdx(0);
                setShowThresholds(false);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                selectedId === k
                  ? 'bg-[#0369a1] text-white border-[#0369a1]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {SHORT_LABELS[lang]?.[k] || SHORT_LABELS.es[k] || protocols[k]?.title || k}
            </button>
          ))}
        </div>

        {/* Contenido principal Wizard 2 columnas */}
        {proto && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
            {/* Izquierda: Wizard Paso a Paso */}
            <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-4 lg:overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{proto.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      <Cpu className="w-3 h-3" />
                      {deviceLabel}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {isEn ? 'Domain:' : 'Dominio:'} {riskDomainLabel}
                    </span>
                  </div>
                </div>

                {lockWarnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">
                        {isEn ? 'Active Clinical / SWaP Interlock' : 'Candado Clínico / SWaP Activo'}
                      </span>
                      {lockWarnings.map((w, idx) => (
                        <span key={idx} className="text-[11px]">{w}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navegación numérica rápida de pasos */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {steps.map((_, i) => {
                      const done = Boolean(checkedSteps[stepBucketKey]?.[i]);
                      const active = i === safeIdx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setStepIdx(i)}
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#0369a1] text-white border-[#0369a1] scale-105 shadow-xs'
                              : done
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                          }`}
                        >
                          {done && !active ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] shrink-0">
                    <span className="font-semibold text-emerald-800 tabular-nums">
                      {completedCount}/{steps.length} {isEn ? 'done' : 'completados'}
                    </span>
                    {completedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => resetSteps(selectedId)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer p-1"
                        title={isEn ? 'Reset checklist' : 'Reiniciar checklist'}
                        aria-label={isEn ? 'Reset checklist' : 'Reiniciar checklist'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tarjeta Hero del Paso Actual */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                      {isEn ? `Step ${safeIdx + 1} of ${steps.length}` : `Paso ${safeIdx + 1} de ${steps.length}`}
                    </span>
                    {isCurrentDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> {isEn ? 'Completed' : 'Completado'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-[15px] font-medium text-slate-900 leading-relaxed">
                    {currentStepText}
                  </p>
                </div>

                {/* Fundamento + Umbrales colapsables */}
                {rationaleText && (
                  <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3.5 leading-relaxed">
                    <strong>{isEn ? 'Clinical Rationale:' : 'Fundamento clínico:'}</strong> {rationaleText}
                  </div>
                )}

                {thresholdsObj && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowThresholds((v) => !v)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <span>{isEn ? 'Decision Thresholds' : 'Umbrales de Decisión Clínica'}</span>
                      {showThresholds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showThresholds && (
                      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white border-t border-slate-200">
                        {(thresholdsObj.normal || thresholdsObj.nominal) && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11.5px] text-emerald-900">
                            <strong className="block mb-0.5">Nominal</strong>
                            {thresholdsObj.normal || thresholdsObj.nominal}
                          </div>
                        )}
                        {thresholdsObj.caution && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-900">
                            <strong className="block mb-0.5">{isEn ? 'Caution' : 'Precaución'}</strong>
                            {thresholdsObj.caution}
                          </div>
                        )}
                        {thresholdsObj.critical && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11.5px] text-rose-900">
                            <strong className="block mb-0.5">{isEn ? 'Critical / Alert' : 'Crítico / Alerta'}</strong>
                            {thresholdsObj.critical}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controles Wizard inferiores */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={safeIdx === 0}
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Previous' : 'Anterior'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStepDone(selectedId, safeIdx, !isCurrentDone)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {isCurrentDone ? (isEn ? 'Unmark' : 'Desmarcar') : isEn ? 'Mark Done' : 'Solo Marcar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStepDone(selectedId, safeIdx, true);
                      if (safeIdx < steps.length - 1) {
                        setStepIdx(safeIdx + 1);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>
                      {safeIdx < steps.length - 1
                        ? isEn
                          ? 'Complete & Next'
                          : 'Marcar y Siguiente'
                        : isEn
                        ? 'Finish Protocol'
                        : 'Finalizar Protocolo'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Derecha: Ilustración SVG Animada */}
            <div className="lg:col-span-5 bg-slate-50/70 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-center items-center gap-4">
              <ProtocolSvgIllustration protocolId={selectedId} lang={lang} />
              <div className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-[11.5px] text-slate-600 flex flex-col gap-1">
                <span className="font-bold text-slate-800">
                  {isEn ? 'Execution Checklist Summary' : 'Resumen de Ejecución'}
                </span>
                <span>
                  {completedCount === steps.length && steps.length > 0
                    ? isEn
                      ? 'All protocol steps verified.'
                      : 'Todos los pasos del protocolo verificados.'
                    : isEn
                    ? `${steps.length - completedCount} step(s) remaining in this session.`
                    : `Faltan ${steps.length - completedCount} paso(s) por verificar en esta sesión.`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
