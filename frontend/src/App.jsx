import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import TopHeader from './components/TopHeader';
import LeftSidebar from './components/LeftSidebar';
import BaselineModal from './components/BaselineModal';
import BodyMapSvg from './components/BodyMapSvg';
import PvtTestModal from './components/PvtTestModal';
import AmslerModal from './components/AmslerModal';
import AudiometryModal from './components/AudiometryModal';
import BreathingModal from './components/BreathingModal';
import ProtocolModal from './components/ProtocolModal';
import EmergencyModal from './components/EmergencyModal';
import VitalsInputModal from './components/VitalsInputModal';
import SymptomsModal from './components/SymptomsModal';
import PhysicsFormulasModal from './components/PhysicsFormulasModal';
import FloatingMenu from './components/FloatingMenu';
import { TRANSLATIONS } from './i18n';
import { BookOpen, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const PROTOCOL_LABELS = {
  es: {
    pocus_onsd: 'POCUS Ocular (ONSD)',
    pocus_dvt: 'POCUS TVP Yugular',
    pcba_istat: 'Analítica i-STAT',
    lbnp_safety: 'Seguridad LBNP',
    abcde_0g_fast: 'ABCDE 0g + FAST',
    spe_storm_shelter: 'Refugio Tormenta SPE',
    renal_stone_pocus: 'POCUS Litiasis Renal',
    fluid_loading_reentry: 'Carga Hídrica Reentrada',
    eva_dcs_hypoxia: 'Resp. / Hipoxia',
    thigh_cuff_sans: 'Brazaletes SANS',
    breathing_01hz: 'Respiración 0.1 Hz',
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
    eva_dcs_hypoxia: 'Resp. / Hypoxia',
    thigh_cuff_sans: 'SANS Thigh Cuffs',
    breathing_01hz: '0.1 Hz Breathing',
  },
};

const STATUS_BADGE = {
  es: {
    nominal: {
      label: 'Estado: NOMINAL',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    },
    caution: {
      label: 'Estado: PRECAUCIÓN',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: AlertTriangle,
    },
    critical: {
      label: 'Estado: CRÍTICO',
      cls: 'bg-rose-50 text-rose-800 border-rose-200',
      Icon: ShieldAlert,
    },
  },
  en: {
    nominal: {
      label: 'Status: NOMINAL',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    },
    caution: {
      label: 'Status: CAUTION',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: AlertTriangle,
    },
    critical: {
      label: 'Status: CRITICAL',
      cls: 'bg-rose-50 text-rose-800 border-rose-200',
      Icon: ShieldAlert,
    },
  },
};

const MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB

const TELEMETRY_WHITELIST = new Set([
  'environment_id',
  'shielding_posture',
  'is_pre_sleep_window',
  'is_planetary_descent_soon',
  'cabin_ppco2_mmhg',
  'cabin_pressure_psia',
  'cabin_o2_percent',
  'cdra_scrubber_efficiency',
  'crew_count',
  'spe_event_dose_mgyeq',
  'hours_since_spe',
  'time_to_emesis_hours',
  'cabin_noise_dba',
  'heart_rate_bpm',
  'hrv_rmssd_ms',
  'systolic_bp',
  'diastolic_bp',
  'spo2_percent',
  'resp_rate_rpm',
  'temp_celsius',
  'onsd_measured_mm',
  'oct_trt250_delta_um',
  'oct_rnfl_delta_um',
  'iop_mmhg',
  'amsler_distortions',
  'near_acuity',
  'pocus_dvt_suspicion',
  'ecg_arrhythmia_detected',
  'exercise_adherence_ratio',
  'alendronate_active',
  'potassium_citrate_active',
  'water_intake_liters',
  'urine_output_liters',
  'urine_specific_gravity',
  'ionized_calcium_mmol_l',
  'flank_pain',
  'sleep_hours',
  'sleep_efficiency_pct',
  'sleep_onset_latency_min',
  'pvt_mean_rt_ms',
  'pvt_lapses',
  'anxiety_vas',
  'gad2_score',
  'audiometry_shift_4khz_db',
  'glucose_mg_dl',
  'skin_rash_or_viral_symptoms',
]);

function parseCsvRecords(rawText) {
  const cleanText = rawText.replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i += 1) {
    const ch = cleanText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && cleanText[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      if (row.some((c) => c.trim() !== '')) {
        records.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) {
    records.push(row);
  }
  return records;
}

function coerceCsvValue(raw) {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  return trimmed;
}

function sanitizeTelemetryRow(rawRow) {
  if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
    return {};
  }
  const clean = {};
  for (const [key, val] of Object.entries(rawRow)) {
    if (!TELEMETRY_WHITELIST.has(key) || val === undefined || val === null) continue;
    if (typeof val === 'boolean') {
      clean[key] = val;
    } else if (typeof val === 'number') {
      if (Number.isFinite(val)) clean[key] = val;
    } else if (typeof val === 'string') {
      const coerced = coerceCsvValue(val);
      if (coerced !== undefined) clean[key] = coerced;
    }
  }
  return clean;
}

function safeSetStorage(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {
    // ignore storage quota or privacy-mode errors
  }
}

export default function App() {
  const [environments, setEnvironments] = useState({});
  const [protocols, setProtocols] = useState({});
  const [scenarios, setScenarios] = useState({});
  const [baseline, setBaseline] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState('iss');
  const [selectedZone, setSelectedZone] = useState('head_neuro_ocular');
  const [demoMode, setDemoMode] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('nominal');
  const [telemetry, setTelemetry] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [baselineModalOpen, setBaselineModalOpen] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState(null); // pvt | amsler | audiometry | breathing | vitals | symptoms | emergency
  const [protocolModal, setProtocolModal] = useState({ open: false, id: null });
  const [backendError, setBackendError] = useState(null);
  const [importNotice, setImportNotice] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('eimo_lang') || 'es');
  const [liveStream, setLiveStream] = useState(true);
  const [emergencyQueue, setEmergencyQueue] = useState([]);
  const telemetryRef = useRef(null);
  telemetryRef.current = telemetry;
  const importTimerRef = useRef(null);
  const stepInFlightRef = useRef(false);
  const [completedRoutine, setCompletedRoutine] = useState(() => {
    try {
      const saved = localStorage.getItem('eimo_routine_done');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => () => {
    if (importTimerRef.current) {
      clearTimeout(importTimerRef.current);
    }
  }, []);

  const handleChangeLang = async (nextLang) => {
    setLang(nextLang);
    safeSetStorage('eimo_lang', nextLang);
    try {
      const [envRes, protoRes, scRes] = await Promise.all([
        api.getEnvironments(nextLang),
        api.getProtocols(nextLang),
        api.getScenarios(nextLang),
      ]);
      setEnvironments(envRes.environments || {});
      setProtocols(protoRes.protocols || {});
      setScenarios(scRes.scenarios || {});
      if (telemetryRef.current) {
        const evalRes = await api.evaluateTelemetry(telemetryRef.current, nextLang, false);
        setEvaluation(evalRes);
      }
    } catch (err) {
      setBackendError(err.message);
    }
  };

  useEffect(() => {
    if (!liveStream || demoMode) return undefined;
    const id = setInterval(async () => {
      const cur = telemetryRef.current;
      if (!cur) return;
      try {
        const res = await api.stepTelemetry(cur, 15.0, false, lang);
        // Descartar respuesta si el usuario cambió escenario/telemetría mientras estaba en vuelo
        if (telemetryRef.current !== cur) return;
        if (res.telemetry) {
          setTelemetry(res.telemetry);
          setEvaluation(res);
        }
      } catch {
        // Silencioso en ticks de fondo
      }
    }, 4000);
    return () => clearInterval(id);
  }, [liveStream, demoMode, lang]);

  const refreshHistory = useCallback(async () => {
    try {
      const hRes = await api.getHistory();
      setHistory(hRes.history || []);
      return hRes.history || [];
    } catch {
      return [];
    }
  }, []);

  const refreshEmergencyQueue = useCallback(async () => {
    try {
      const qRes = await api.getEmergencyQueue();
      setEmergencyQueue(qRes.queue || []);
    } catch {
      // Silencioso en polling pasivo
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [envRes, protoRes, scRes, baseRes, histList] = await Promise.all([
          api.getEnvironments(lang),
          api.getProtocols(lang),
          api.getScenarios(lang),
          api.getBaseline(),
          refreshHistory(),
        ]);
        setEnvironments(envRes.environments || {});
        setProtocols(protoRes.protocols || {});
        setScenarios(scRes.scenarios || {});
        setBaseline(baseRes.baseline);

        const lastSaved = histList?.[0]?.telemetry;
        const initialTelemetry =
          lastSaved || scRes.scenarios?.nominal?.telemetry || { environment_id: 'iss' };
        setActiveEnvId(initialTelemetry.environment_id || 'iss');
        setTelemetry(initialTelemetry);

        // Solo persistir registro inicial si SQLite estaba vacío (evita filas duplicadas al recargar)
        const shouldPersistInitial = !histList || histList.length === 0;
        const evalRes = await api.evaluateTelemetry(initialTelemetry, lang, shouldPersistInitial);
        setEvaluation(evalRes);
        setBackendError(null);
        await Promise.all([
          shouldPersistInitial ? refreshHistory() : Promise.resolve(),
          refreshEmergencyQueue(),
        ]);

        const params = new URLSearchParams(window.location.search);
        const isUrlDemo = params.get('demo') === '1' || params.get('demo') === 'true';
        if (isUrlDemo) {
          setDemoMode(true);
        } else if (!localStorage.getItem('eimo_onboarding_seen')) {
          setBaselineModalOpen(true);
        }
      } catch (err) {
        setBackendError(err.message);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runEvaluation = async (nextTelemetry, persist = true) => {
    const prevTelemetry = telemetryRef.current;
    setTelemetry(nextTelemetry);
    try {
      const evalRes = await api.evaluateTelemetry(nextTelemetry, lang, persist);
      setEvaluation(evalRes);
      setBackendError(null);
      if (persist) await refreshHistory();
      return true;
    } catch (err) {
      setTelemetry(prevTelemetry);
      setBackendError(err.message);
      return false;
    }
  };

  const handleStepFastForward = async (dtMinutes) => {
    if (!telemetryRef.current || stepInFlightRef.current) return;
    stepInFlightRef.current = true;
    try {
      const res = await api.stepTelemetry(telemetryRef.current, dtMinutes, true, lang);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
        setEvaluation(res);
        setBackendError(null);
        await refreshHistory();
      }
    } catch (err) {
      setBackendError(err.message);
    } finally {
      stepInFlightRef.current = false;
    }
  };

  const handleSelectEnv = (envId) => {
    setActiveEnvId(envId);
    if (telemetry) {
      runEvaluation({ ...telemetry, environment_id: envId });
    }
  };

  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
    const sc = scenarios[scenarioId];
    if (sc?.telemetry) {
      setActiveEnvId(sc.telemetry.environment_id || 'iss');
      runEvaluation(sc.telemetry);
      if (sc.open_emergency_modal) {
        setActiveToolModal('emergency');
      }
    }
  };

  const handleSaveBaseline = async (updatedProfile) => {
    const res = await api.saveBaseline(updatedProfile);
    setBaseline(res.baseline);
    safeSetStorage('eimo_onboarding_seen', '1');
    if (telemetry) {
      await runEvaluation(telemetry);
    }
  };

  const handleApplyTestTelemetry = (patch) => {
    if (!telemetry) return;
    runEvaluation({ ...telemetry, ...patch });
  };

  const markRoutineDone = (id, done = true) => {
    setCompletedRoutine((prev) => {
      const next = { ...prev, [id]: done };
      try {
        localStorage.setItem('eimo_routine_done', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const handleToggleRoutine = (id) => {
    const nextDone = !completedRoutine[id];
    markRoutineDone(id, nextDone);
    if (id === 'hydration') {
      handleApplyTestTelemetry({ water_intake_liters: nextDone ? 2.6 : 1.8 });
    } else if (id === 'exercise') {
      handleApplyTestTelemetry({ exercise_adherence_ratio: nextDone ? 1.0 : 0.55 });
    }
  };

  const handleResetRoutine = () => {
    setCompletedRoutine({});
    try {
      localStorage.removeItem('eimo_routine_done');
    } catch {
      // ignore storage errors
    }
  };

  const handleOpenProtocol = (protocolId) => {
    if (protocolId === 'breathing_01hz') {
      setActiveToolModal('breathing');
      return;
    }
    setProtocolModal({ open: true, id: protocolId });
  };

  const handleResetNominal = () => {
    const nominalTel = {
      ...(scenarios?.nominal?.telemetry || {}),
      environment_id: activeEnvId || 'iss',
    };
    setActiveScenarioId('nominal');
    runEvaluation(nominalTel);
  };

  const handleSyncQueue = useCallback(async () => {
    try {
      const res = await api.syncEmergencyQueue();
      setEmergencyQueue(res.queue || []);
      setBackendError(null);
    } catch (err) {
      setBackendError(err.message);
    }
  }, []);

  const handleSyncSinglePacket = useCallback(async (packetId) => {
    try {
      const res = await api.syncEmergencyPacket(packetId);
      setEmergencyQueue(res.queue || []);
      setBackendError(null);
    } catch (err) {
      setBackendError(err.message);
    }
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      await api.clearHistory();
      setHistory([]);
      setBackendError(null);
    } catch (err) {
      setBackendError(err.message);
    }
  }, []);

  const handleClearTransmittedQueue = useCallback(async () => {
    try {
      const res = await api.clearTransmittedQueue();
      setEmergencyQueue(res.queue || []);
      setBackendError(null);
    } catch (err) {
      setBackendError(err.message);
    }
  }, []);

  const handleImportTelemetryFile = async (file) => {
    try {
      if (!file) return;
      if (file.size > MAX_IMPORT_BYTES) {
        setBackendError(
          lang === 'en'
            ? 'Imported file exceeds maximum allowed size (1 MB).'
            : 'El archivo importado supera el tamaño máximo permitido (1 MB).'
        );
        return;
      }

      const text = await file.text();
      let rawRows = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const cleanText = text.replace(/^\uFEFF/, '');
        const parsed = JSON.parse(cleanText);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const records = parseCsvRecords(text);
        if (records.length >= 2) {
          const headers = records[0].map((h) => h.trim());
          rawRows = records.slice(1).map((cols) => {
            const obj = {};
            headers.forEach((h, idx) => {
              if (h) obj[h] = cols[idx] ?? '';
            });
            return obj;
          });
        }
      }

      const rows = rawRows
        .map(sanitizeTelemetryRow)
        .filter((obj) => Object.keys(obj).length > 0);

      if (!rows.length) {
        setBackendError(
          lang === 'en'
            ? 'Imported file contains no valid telemetry rows.'
            : 'El archivo importado no contiene filas válidas de telemetría.'
        );
        return;
      }

      let curTel = { ...(telemetryRef.current || telemetry || {}) };
      const cappedRows = rows.slice(0, 10);
      let importedCount = 0;
      for (const row of cappedRows) {
        curTel = { ...curTel, ...row };
        const ok = await runEvaluation(curTel);
        if (!ok) return;
        if (curTel.environment_id) setActiveEnvId(curTel.environment_id);
        importedCount += 1;
      }

      const truncatedNote =
        rows.length > 10
          ? lang === 'en'
            ? ` (truncated from ${rows.length} rows; max 10 per batch)`
            : ` (truncado de ${rows.length} filas; máx. 10 por lote)`
          : '';
      setImportNotice(
        lang === 'en'
          ? `Imported ${importedCount} row(s) from ${file.name} and persisted to SQLite.${truncatedNote}`
          : `Importadas ${importedCount} fila(s) desde ${file.name} y guardadas en SQLite.${truncatedNote}`
      );
      if (importTimerRef.current) clearTimeout(importTimerRef.current);
      importTimerRef.current = setTimeout(() => setImportNotice(null), 5000);
    } catch (err) {
      setBackendError(
        lang === 'en'
          ? `Error importing telemetry: ${err.message}`
          : `Error importando telemetría: ${err.message}`
      );
    }
  };

  const badgeSet = STATUS_BADGE[lang] || STATUS_BADGE.es;
  const statusInfo = badgeSet[evaluation?.global_status || 'nominal'];
  const StatusIcon = statusInfo.Icon;

  const displayTelemetry = telemetry || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col">
      <TopHeader
        environments={environments}
        activeEnvId={activeEnvId}
        onSelectEnv={handleSelectEnv}
        baseline={baseline}
        onOpenEmergency={() => setActiveToolModal('emergency')}
        onOpenBaseline={() => setBaselineModalOpen(true)}
        onOpenPhysics={() => setActiveToolModal('physics')}
        lang={lang}
        onChangeLang={handleChangeLang}
      />

      {backendError && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <span>
            {lang === 'en' ? 'API backend error' : 'Error en backend FastAPI'}{' '}
            <code>/api</code> ({backendError}).
          </span>
          <button
            type="button"
            onClick={() => setBackendError(null)}
            className="text-rose-700 font-bold hover:underline shrink-0 cursor-pointer"
          >
            {lang === 'en' ? 'Dismiss' : 'Cerrar'}
          </button>
        </div>
      )}

      {importNotice && (
        <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {importNotice}
        </div>
      )}

      <main className="flex-1 w-full mx-auto flex flex-col lg:flex-row lg:min-h-[calc(100vh-64px)] bg-white">
        <LeftSidebar
          demoMode={demoMode}
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          activeEnv={environments[activeEnvId]}
          telemetry={telemetry || {}}
          onApplyPatch={handleApplyTestTelemetry}
          onStepFastForward={handleStepFastForward}
          onOpenBaseline={() => setBaselineModalOpen(true)}
          onOpenToolModal={(key) => setActiveToolModal(key)}
          completedRoutine={completedRoutine}
          onToggleRoutine={handleToggleRoutine}
          onMarkRoutine={markRoutineDone}
          onResetRoutine={handleResetRoutine}
          lang={lang}
        />

        <section className="flex-1 min-w-0 p-4 lg:p-5 flex flex-col min-h-0">
          {/* Centro (Ser Humano Grande + Signos alrededor + Gráfica) y Derecha (Prioridades) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 flex flex-col min-h-0">
              <BodyMapSvg
                zones={evaluation?.zones || {}}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                environment={environments[activeEnvId]}
                models={evaluation?.models || {}}
                telemetry={displayTelemetry}
                history={history}
                emergencyQueue={emergencyQueue}
                onSyncQueue={handleSyncQueue}
                onClearHistory={handleClearHistory}
                onClearTransmittedQueue={handleClearTransmittedQueue}
                onResetNominal={handleResetNominal}
                onImportTelemetry={handleImportTelemetryFile}
                onOpenVitalsInput={() => setActiveToolModal('vitals')}
                onOpenSymptoms={() => setActiveToolModal('symptoms')}
                onOpenToolModal={(key) => setActiveToolModal(key)}
                onOpenProtocol={(pid) => handleOpenProtocol(pid)}
                liveStream={liveStream}
                onToggleLive={() => setLiveStream((v) => !v)}
                lang={lang}
              />
            </div>

            <div className="xl:col-span-4 xl:border-l xl:border-slate-200 xl:pl-6 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.prioritiesTitle}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${statusInfo.cls}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProtocolModal({ open: true, id: null })}
                  className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.viewAllProtocols}
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 divide-y divide-slate-100">
                {(evaluation?.priorities || []).map((p, idx) => (
                  <div
                    key={`${p.title}-${idx}`}
                    className="py-3.5 flex gap-3 shrink-0"
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        p.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : p.severity === 'caution'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{p.title}</span>
                        <span
                          className={`text-[10px] font-bold uppercase shrink-0 ${
                            p.severity === 'critical'
                              ? 'text-rose-700'
                              : p.severity === 'caution'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {lang === 'en'
                            ? p.severity
                            : p.severity === 'critical'
                            ? 'CRÍTICO'
                            : p.severity === 'caution'
                            ? 'PRECAUCIÓN'
                            : 'NOMINAL'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{p.detail}</p>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">{p.action}</p>
                      {p.protocol_id && (
                        <button
                          type="button"
                          onClick={() => handleOpenProtocol(p.protocol_id)}
                          className="self-start mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-sky-700 hover:text-sky-900 hover:underline text-left whitespace-nowrap cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {lang === 'en' ? 'Protocol' : 'Protocolo'}:{' '}
                            {PROTOCOL_LABELS[lang]?.[p.protocol_id] || p.protocol_id} →
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modales Interactivos */}
      <BaselineModal
        isOpen={baselineModalOpen}
        initialProfile={baseline}
        lang={lang}
        onSave={handleSaveBaseline}
        onClose={() => {
          safeSetStorage('eimo_onboarding_seen', '1');
          setBaselineModalOpen(false);
        }}
      />

      <PvtTestModal
        isOpen={activeToolModal === 'pvt'}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onApplyResult={(patch) => {
          handleApplyTestTelemetry(patch);
          markRoutineDone('pvt', true);
        }}
      />

      <VitalsInputModal
        isOpen={activeToolModal === 'vitals'}
        telemetry={telemetry || {}}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onApplyResult={handleApplyTestTelemetry}
      />

      <SymptomsModal
        isOpen={activeToolModal === 'symptoms'}
        telemetry={telemetry || {}}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onApplyResult={handleApplyTestTelemetry}
      />

      <AmslerModal
        isOpen={activeToolModal === 'amsler'}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onApplyResult={(patch) => {
          handleApplyTestTelemetry(patch);
          markRoutineDone('amsler', true);
        }}
      />

      <AudiometryModal
        isOpen={activeToolModal === 'audiometry'}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onApplyResult={(patch) => {
          handleApplyTestTelemetry(patch);
          markRoutineDone('audiometry', true);
        }}
      />

      <BreathingModal
        isOpen={activeToolModal === 'breathing'}
        telemetry={telemetry}
        evaluation={evaluation}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
        onComplete={() => markRoutineDone('breathing', true)}
      />

      <ProtocolModal
        isOpen={protocolModal.open}
        protocols={protocols}
        initialProtocolId={protocolModal.id}
        evaluation={evaluation}
        telemetry={telemetry}
        environment={environments[activeEnvId]}
        sessionKey={demoMode ? activeScenarioId : 'live'}
        lang={lang}
        onClose={() => setProtocolModal({ open: false, id: null })}
      />

      <EmergencyModal
        isOpen={activeToolModal === 'emergency'}
        onClose={() => {
          setActiveToolModal(null);
          refreshEmergencyQueue();
        }}
        environment={environments[activeEnvId]}
        baseline={baseline}
        telemetry={telemetry}
        onSyncQueue={handleSyncQueue}
        onSyncPacket={handleSyncSinglePacket}
        onRefreshQueue={refreshEmergencyQueue}
        lang={lang}
      />

      <PhysicsFormulasModal
        isOpen={activeToolModal === 'physics'}
        lang={lang}
        onClose={() => setActiveToolModal(null)}
      />

      <FloatingMenu
        demoMode={demoMode}
        onToggleDemo={() => setDemoMode((v) => !v)}
        lang={lang}
      />
    </div>
  );
}
