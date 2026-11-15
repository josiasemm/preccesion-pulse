import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Check,
  Clock,
  HeartPulse,
  Radio,
  Send,
  ShieldAlert,
  Stethoscope,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { api } from '../api/client';

const CATEGORY_CONFIG = {
  '': {
    label: { es: 'Evaluación Inicial ABCDE (Sin clasificar)', en: 'Initial ABCDE Assessment (Unclassified)' },
    shortTag: { es: 'Triage Inicial ABCDE', en: 'Initial ABCDE Triage' },
    redFlags: [
      { id: 'rf_airway', es: 'Compromiso de vía aérea / estridor', en: 'Airway compromise / stridor' },
      { id: 'rf_shock', es: 'Hipotensión (PAS < 90 mmHg) o síncope', en: 'Hypotension (SBP < 90 mmHg) or syncope' },
      { id: 'rf_neuro', es: 'Déficit neurológico agudo / alteración conciencia', en: 'Acute neuro deficit / altered LOC' },
    ],
    steps: [
      { id: 's1', es: 'A — Verificar vía aérea permeable y retirar cuerpos libres en 0g', en: 'A — Verify patent airway and clear 0g debris' },
      { id: 's2', es: 'B — Medir SpO₂, FR y auscultar/POCUS pulmonar bilateral', en: 'B — Check SpO₂, RR, and bilateral breath sounds / lung POCUS' },
      { id: 's3', es: 'C — Pulso central, PA, acceso IV/IO y monitor ECG 12 derivaciones', en: 'C — Central pulse, BP, IV/IO access, and 12-lead ECG' },
      { id: 's4', es: 'D — Glasgow, pupilas, glucemia capilar (i-STAT) y clasificar evento', en: 'D — GCS, pupils, capillary glucose (i-STAT), and classify event' },
    ],
  },
  stroke: {
    label: { es: 'ICTUS / Evento Neurovascular Agudo (FAST)', en: 'Acute Stroke / Neurovascular Event (FAST)' },
    shortTag: { es: 'ICTUS Agudo (FAST)', en: 'Acute Stroke (FAST)' },
    redFlags: [
      { id: 'faceAsym', es: 'F — Asimetría facial súbita', en: 'F — Sudden facial droop / asymmetry' },
      { id: 'armDrift', es: 'A — Debilidad o caída de extremidad', en: 'A — Arm drift / unilateral weakness' },
      { id: 'speechSlur', es: 'S — Disartria, afasia o confusión', en: 'S — Slurred speech / aphasia / confusion' },
    ],
    steps: [
      { id: 's1', es: 'Asegurar vía aérea en 0g (anclaje Evetts-Russomano si inconsciente)', en: 'Secure airway in 0g (Evetts-Russomano restraint if unresponsive)' },
      { id: 's2', es: 'Nada por vía oral (NPO); descartar hipoglucemia (< 70 mg/dL IV Dextrosa)', en: 'NPO (nothing by mouth); rule out hypoglycemia (< 70 mg/dL IV Dextrose)' },
      { id: 's3', es: 'Monitorizar PA cada 5 min; NO bajar PA bruscamente sin orden MCC', en: 'Monitor BP q5min; avoid abrupt BP reduction without MCC order' },
      { id: 's4', es: 'Registrar hora exacta T0 (última vez visto bien) para enlace Tierra', en: 'Log exact LKW / T0 timestamp for Earth MCC neurological review' },
    ],
  },
  cardiac: {
    label: { es: 'Dolor Torácico / Arritmia Maligna (SCA)', en: 'Chest Pain / Malignant Arrhythmia (ACS)' },
    shortTag: { es: 'Dolor Torácico / Arritmia', en: 'Chest Pain / Arrhythmia' },
    redFlags: [
      { id: 'chestPain', es: 'Dolor opresivo retroesternal / irradiación mandíbula o brazo', en: 'Substernal chest pressure / jaw or arm radiation' },
      { id: 'palpitations', es: 'Arritmia sostenida, diaforesis o pre-síncope', en: 'Sustained arrhythmia, diaphoresis, or presyncope' },
      { id: 'dyspneaCard', es: 'Disnea aguda o estertores / hipotensión', en: 'Acute dyspnea, rales, or hypotension' },
    ],
    steps: [
      { id: 's1', es: 'ECG de 12 derivaciones inmediato y transmisión continua al enlace', en: 'Immediate 12-lead ECG and continuous link transmission' },
      { id: 's2', es: 'AAS 325 mg masticada si alerta y sin alergia ni sangrado activo', en: 'ASA 325 mg chewed if alert and no allergy / active bleeding' },
      { id: 's3', es: 'Nitroglicerina SL 0.4 mg SOLO si PAS ≥ 100 mmHg y sin inhibidores PDE5', en: 'SL Nitroglycerin 0.4 mg ONLY if SBP ≥ 100 mmHg and no PDE5i' },
      { id: 's4', es: 'Preparar DEA: secar sudoración en 0g y alejar O₂ libre > 1 m antes de descarga', en: 'Prep AED: dry chest sweat in 0g and move free O₂ > 1 m pre-shock' },
    ],
  },
  anaphylaxis: {
    label: { es: 'Anafilaxia Grave / Edema de Vía Aérea', en: 'Severe Anaphylaxis / Airway Edema' },
    shortTag: { es: 'Anafilaxia Grave', en: 'Severe Anaphylaxis' },
    redFlags: [
      { id: 'stridor', es: 'Estridor laríngeo, edema labial/lingual o sibilancias', en: 'Laryngeal stridor, lip/tongue angioedema, or wheezing' },
      { id: 'urticaria', es: 'Urticaria generalizada o eritema súbito', en: 'Generalized urticaria or sudden flushing' },
      { id: 'hypotensionAna', es: 'Hipotensión distributiva (PAS < 90 mmHg)', en: 'Distributive hypotension (SBP < 90 mmHg)' },
    ],
    steps: [
      { id: 's1', es: 'Epinefrina 1 mg/mL (1:1000) 0.3–0.5 mg IM cara anterolateral del muslo', en: 'Epinephrine 1 mg/mL (1:1000) 0.3–0.5 mg IM anterolateral thigh' },
      { id: 's2', es: 'Repetir Epinefrina IM cada 5–15 min si persiste estridor o shock', en: 'Repeat IM Epinephrine q5–15 min if stridor or shock persists' },
      { id: 's3', es: 'Oxígeno 100% mascarilla + bolo IV NaCl 0.9% (500–1000 mL)', en: '100% O₂ mask + IV 0.9% NaCl bolus (500–1000 mL)' },
      { id: 's4', es: 'Retirar alérgeno/fármaco; segunda línea antihistamínico + corticoide IV', en: 'Stop allergen/drug exposure; 2nd-line antihistamine + IV steroid' },
    ],
  },
  dcs: {
    label: { es: 'Enfermedad por Descompresión Tipo II (DCS / EVA)', en: 'Type II Decompression Sickness (DCS / EVA)' },
    shortTag: { es: 'DCS Tipo II / EVA', en: 'Type II DCS / EVA' },
    redFlags: [
      { id: 'neuroDcs', es: 'Vértigo, parestesias, ataxia o déficit visual post-EVA', en: 'Post-EVA vertigo, paresthesias, ataxia, or visual deficit' },
      { id: 'chokes', es: 'Dolor retroesternal al inspirar / tos ("chokes") o cutis marmorata', en: 'Inspiratory chest pain / cough ("chokes") or cutis marmorata' },
      { id: 'jointPain', es: 'Dolor articular profundo que no cede en reposo', en: 'Deep periarticular pain ("bends") persistent at rest' },
    ],
    steps: [
      { id: 's1', es: 'Oxígeno normobárico al 100% inmediato (mascarilla sin reinhalación)', en: 'Immediate 100% normobaric O₂ via non-rebreather mask' },
      { id: 's2', es: 'Re-presurización en traje o esclusa/cámara hiperbárica según protocolo EVA', en: 'Suit or airlock/hyperbaric chamber re-pressurization per EVA SOP' },
      { id: 's3', es: 'Hidratación isotónica (NaCl 0.9% IV o VO si alerta y tolera)', en: 'Isotonic hydration (IV 0.9% NaCl or PO if alert and tolerating)' },
      { id: 's4', es: 'Examen neurológico seriado cada 15 min para vigilar burbujas en SNC', en: 'Serial neuro exams q15min to monitor CNS gas-bubble progression' },
    ],
  },
};

export default function EmergencyModal({
  isOpen,
  onClose,
  environment,
  baseline,
  telemetry = {},
  onSyncQueue,
  onSyncPacket,
  onRefreshQueue,
  lang = 'es',
}) {
  const isEn = lang === 'en';
  const rttSeconds = Number(environment?.rtt_seconds || 0);
  const initialCountdown = rttSeconds < 1 ? 0 : Math.ceil(rttSeconds);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [redFlagType, setRedFlagType] = useState('');
  const [checkedFlags, setCheckedFlags] = useState({});
  const [gcsScore, setGcsScore] = useState('');
  const [onsetTime, setOnsetTime] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [abcdeDone, setAbcdeDone] = useState({});

  const [countdown, setCountdown] = useState(0);
  const [packetId, setPacketId] = useState(null);
  const [txState, setTxState] = useState('idle'); // idle | sending | queued | synced | error
  const [txError, setTxError] = useState(null);

  const hasUserEditedRef = useRef(false);
  const lastPacketIdRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const initialPromiseRef = useRef(null);
  const syncInFlightRef = useRef(false);
  const txInFlightRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const onSyncPacketRef = useRef(onSyncPacket);
  const onSyncQueueRef = useRef(onSyncQueue);
  const onRefreshQueueRef = useRef(onRefreshQueue);

  isOpenRef.current = isOpen;
  onSyncPacketRef.current = onSyncPacket;
  onSyncQueueRef.current = onSyncQueue;
  onRefreshQueueRef.current = onRefreshQueue;

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Al abrir: reiniciar todo en estado neutro, arrancar T+ 00:00 y abrir enlace inicial sin falsos positivos
  useEffect(() => {
    if (!isOpen) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      initialPromiseRef.current = null;
      syncInFlightRef.current = false;
      txInFlightRef.current = false;
      return undefined;
    }
    let cancelled = false;

    setElapsedSec(0);
    setRedFlagType('');
    setCheckedFlags({});
    setGcsScore('');
    setOnsetTime('');
    setCustomNotes('');
    setAbcdeDone({});
    setCountdown(initialCountdown);
    setPacketId(null);
    lastPacketIdRef.current = null;
    syncInFlightRef.current = false;
    txInFlightRef.current = false;
    setTxError(null);
    hasUserEditedRef.current = false;

    const sendInitialStream = async () => {
      setTxState('sending');
      try {
        const rawSpo2 = telemetry?.spo2_percent ?? telemetry?.spo2_pct;
        const res = await api.sendEmergencyStoreForward(
          {
            packet_id: null,
            elapsed_seconds: 0,
            environment_id: environment?.id || 'iss',
            red_flag_type: isEn ? 'Initial ABCDE Assessment (Live)' : 'Evaluación Aguda ABCDE (En curso)',
            fast_face_asymmetry: false,
            fast_arm_drift: false,
            fast_speech_slurred: false,
            gcs_score: null,
            symptom_onset_time: '',
            capillary_glucose_mg_dl: telemetry?.glucose_mg_dl != null ? Number(telemetry.glucose_mg_dl) : null,
            systolic_bp: telemetry?.systolic_bp != null ? Number(telemetry.systolic_bp) : null,
            diastolic_bp: telemetry?.diastolic_bp != null ? Number(telemetry.diastolic_bp) : null,
            heart_rate_bpm: telemetry?.heart_rate_bpm != null ? Number(telemetry.heart_rate_bpm) : null,
            spo2_percent: rawSpo2 != null ? Number(rawSpo2) : null,
            notes: `T+00:00 Link opened | Blood: ${baseline?.blood_type || 'Unknown'}`,
          },
          lang
        );
        if (cancelled || !isOpenRef.current) return;
        const pid = res?.packet?.packet_id ?? null;
        lastPacketIdRef.current = pid;
        setPacketId(pid);
        if (initialCountdown === 0) {
          if (pid) {
            if (onSyncPacketRef.current) await onSyncPacketRef.current(pid);
            else await api.syncEmergencyPacket(pid);
          }
          if (cancelled || !isOpenRef.current) return;
          setCountdown(0);
          setTxState('synced');
        } else {
          setTxState('queued');
        }
        onRefreshQueueRef.current?.();
      } catch (err) {
        if (cancelled || !isOpenRef.current) return;
        setTxState('error');
        setTxError(err.message || (isEn ? 'Link error' : 'Error de enlace'));
      }
    };

    const p = sendInitialStream();
    initialPromiseRef.current = p;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cronómetro clínico T+
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Cuenta regresiva RTT estable (sin recrear intervalo cada segundo)
  useEffect(() => {
    if (!isOpen || txState !== 'queued') return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, txState]);

  // Disparar sincronización del paquete activo cuando RTT llega a 0 (sin cancelación por re-render)
  useEffect(() => {
    if (!isOpen || txState !== 'queued' || countdown !== 0 || !packetId || syncInFlightRef.current) return;
    syncInFlightRef.current = true;

    const finalizePacket = async () => {
      try {
        if (onSyncPacketRef.current) {
          await onSyncPacketRef.current(packetId);
        } else {
          await api.syncEmergencyPacket(packetId);
          await onRefreshQueueRef.current?.();
        }
        if (isOpenRef.current) {
          setTxState('synced');
        }
      } catch (err) {
        if (isOpenRef.current) {
          setTxError(err.message || 'Sync failed');
          setTxState('error');
        }
      } finally {
        syncInFlightRef.current = false;
      }
    };

    finalizePacket();
  }, [isOpen, txState, countdown, packetId]);

  // Tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const activeConfig = CATEGORY_CONFIG[redFlagType] || CATEGORY_CONFIG[''];

  const transmitUpdate = async (manualForce = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (txInFlightRef.current) return;
    txInFlightRef.current = true;
    try {
      // Si la creación inicial del paquete aún viaja, esperar su packet_id para no duplicar filas
      if (initialPromiseRef.current) {
        try {
          await initialPromiseRef.current;
        } catch {
          // continuar con packet_id actual o nuevo
        }
      }
      if (!isOpenRef.current) return;

      setTxState('sending');
      setTxError(null);
      const activeFlags = activeConfig.redFlags
        .filter((rf) => Boolean(checkedFlags[rf.id]))
        .map((rf) => (isEn ? rf.en : rf.es));
      const rawSpo2 = telemetry?.spo2_percent ?? telemetry?.spo2_pct;
      const doneStepsCount = Object.values(abcdeDone).filter(Boolean).length;
      const parsedGcs = gcsScore === '' ? null : Number(gcsScore);

      const res = await api.sendEmergencyStoreForward(
        {
          packet_id: lastPacketIdRef.current,
          elapsed_seconds: elapsedSec,
          environment_id: environment?.id || 'iss',
          red_flag_type: isEn ? activeConfig.shortTag.en : activeConfig.shortTag.es,
          fast_face_asymmetry: Boolean(checkedFlags.faceAsym),
          fast_arm_drift: Boolean(checkedFlags.armDrift),
          fast_speech_slurred: Boolean(checkedFlags.speechSlur),
          gcs_score: Number.isInteger(parsedGcs) ? parsedGcs : null,
          symptom_onset_time: onsetTime,
          capillary_glucose_mg_dl: telemetry?.glucose_mg_dl != null ? Number(telemetry.glucose_mg_dl) : null,
          systolic_bp: telemetry?.systolic_bp != null ? Number(telemetry.systolic_bp) : null,
          diastolic_bp: telemetry?.diastolic_bp != null ? Number(telemetry.diastolic_bp) : null,
          heart_rate_bpm: telemetry?.heart_rate_bpm != null ? Number(telemetry.heart_rate_bpm) : null,
          spo2_percent: rawSpo2 != null ? Number(rawSpo2) : null,
          notes: [
            `T+${formatElapsed(elapsedSec)}`,
            Number.isInteger(parsedGcs) ? `GCS ${parsedGcs}/15` : null,
            activeFlags.length ? `Flags: ${activeFlags.join('; ')}` : null,
            `Checklist: ${doneStepsCount}/${activeConfig.steps.length}`,
            customNotes || null,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        lang
      );
      if (!isOpenRef.current) return;
      const pid = res?.packet?.packet_id ?? lastPacketIdRef.current;
      lastPacketIdRef.current = pid;
      setPacketId(pid);
      if (manualForce || initialCountdown === 0) {
        if (pid) {
          if (onSyncPacketRef.current) await onSyncPacketRef.current(pid);
          else await api.syncEmergencyPacket(pid);
        } else if (onSyncQueueRef.current) {
          await onSyncQueueRef.current();
        }
        if (!isOpenRef.current) return;
        setCountdown(0);
        setTxState('synced');
      } else {
        setCountdown(initialCountdown);
        setTxState('queued');
      }
      onRefreshQueueRef.current?.();
    } catch (err) {
      if (!isOpenRef.current) return;
      setTxError(err.message || (isEn ? 'Failed to transmit packet' : 'Error al transmitir paquete'));
      setTxState('error');
    } finally {
      txInFlightRef.current = false;
    }
  };

  // Auto-transmisión debounced cuando el operador modifica datos clínicos
  useEffect(() => {
    if (!isOpen || !hasUserEditedRef.current) return undefined;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      transmitUpdate(false);
    }, 1000);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, redFlagType, checkedFlags, gcsScore, onsetTime, customNotes, abcdeDone]);

  const spo2 = telemetry?.spo2_percent ?? telemetry?.spo2_pct;
  const sbp = telemetry?.systolic_bp;
  const dbp = telemetry?.diastolic_bp;
  const hr = telemetry?.heart_rate_bpm;
  const ppco2 = telemetry?.cabin_ppco2_mmhg;
  const glucose = telemetry?.glucose_mg_dl;

  const attachedPills = useMemo(() => {
    const getTone = (sev) =>
      sev === 'critical'
        ? 'bg-rose-50 border-rose-300 text-rose-800'
        : sev === 'caution'
        ? 'bg-amber-50 border-amber-300 text-amber-800'
        : 'bg-slate-50 border-slate-200 text-slate-800';

    const spo2Sev = spo2 != null ? (spo2 < 90 ? 'critical' : spo2 < 94 ? 'caution' : 'nominal') : 'nominal';
    const bpSev =
      sbp != null && dbp != null
        ? sbp >= 150 || sbp < 90 || dbp >= 95
          ? 'critical'
          : sbp < 100 || sbp >= 140 || dbp >= 90
          ? 'caution'
          : 'nominal'
        : 'nominal';
    const hrSev = hr != null ? (hr > 130 || hr < 40 ? 'critical' : hr > 110 || hr < 45 ? 'caution' : 'nominal') : 'nominal';
    const co2Sev = ppco2 != null ? (ppco2 >= 5.0 ? 'critical' : ppco2 > 3.0 ? 'caution' : 'nominal') : 'nominal';
    const gluSev = glucose != null ? (glucose < 70 || glucose >= 250 ? 'critical' : glucose > 125 ? 'caution' : 'nominal') : 'nominal';

    return [
      { label: 'SpO₂', value: spo2 != null ? `${spo2}%` : '—', cls: getTone(spo2Sev) },
      {
        label: isEn ? 'BP' : 'PA',
        value: sbp != null && dbp != null ? `${Math.round(sbp)}/${Math.round(dbp)} mmHg` : '—',
        cls: getTone(bpSev),
      },
      { label: isEn ? 'HR' : 'FC', value: hr != null ? `${hr} ${isEn ? 'bpm' : 'lpm'}` : '—', cls: getTone(hrSev) },
      { label: 'ppCO₂', value: ppco2 != null ? `${ppco2} mmHg` : '—', cls: getTone(co2Sev) },
      { label: isEn ? 'Glucose' : 'Glucosa', value: glucose != null ? `${glucose} mg/dL` : '—', cls: getTone(gluSev) },
      {
        label: 'GCS',
        value: gcsScore !== '' ? `${gcsScore}/15` : '—',
        cls: gcsScore !== '' && Number(gcsScore) <= 13 ? getTone('critical') : getTone('nominal'),
      },
    ];
  }, [spo2, sbp, dbp, hr, ppco2, glucose, gcsScore, isEn]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[85vh] max-h-[820px] flex flex-col overflow-hidden">
        {/* Cabecera fija con cronómetro estable y estado Store-and-Forward */}
        <div className="px-5 py-3.5 border-b border-rose-200 bg-rose-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="emergency-modal-title" className="text-sm font-bold text-slate-900 truncate">
                  {isEn ? 'Acute Emergency — Track 2 Link' : 'Emergencia Aguda — Enlace Carril 2'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-mono font-bold tabular-nums min-w-[74px] justify-center shrink-0">
                  <Clock className="w-3 h-3" />
                  T+{formatElapsed(elapsedSec)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">
                {environment?.name || 'ISS'} · RTT:{' '}
                <strong className="tabular-nums">{rttSeconds}s</strong>
                {baseline?.allergies ? ` · ${isEn ? 'Allergies' : 'Alergias'}: ${baseline.allergies}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 min-w-[168px] justify-center tabular-nums ${
                txState === 'error'
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : txState === 'synced'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              {txState === 'synced' ? (
                <Wifi className="w-3.5 h-3.5 shrink-0" />
              ) : txState === 'queued' ? (
                <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {txState === 'sending'
                  ? isEn
                    ? 'Packing...'
                    : 'Empaquetando...'
                  : txState === 'synced'
                  ? isEn
                    ? `MCC Synced #${packetId ?? ''}`
                    : `MCC Sincronizado #${packetId ?? ''}`
                  : txState === 'error'
                  ? isEn
                    ? 'Link Error'
                    : 'Error Enlace'
                  : isEn
                  ? `Earth TX in ${countdown}s`
                  : `Envío Tierra ${countdown}s`}
              </span>
            </div>

            <button
              type="button"
              disabled={txState === 'sending'}
              onClick={() => transmitUpdate(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 min-w-[132px] cursor-pointer shrink-0 tabular-nums"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'Force Earth TX' : 'Forzar envío'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close' : 'Cerrar'}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-100 hover:text-slate-900 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {txError && (
          <div className="px-5 py-2 bg-rose-100 border-b border-rose-200 text-xs text-rose-800 font-medium shrink-0">
            {txError}
          </div>
        )}

        {/* Cuerpo en 2 columnas del mismo formato que ProtocolModal */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Izquierda: Clasificación, Banderas Rojas dinámicas, T0 y Signos adjuntos */}
          <div className="md:col-span-6 p-5 overflow-y-auto space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {isEn ? '1. Acute Event Category' : '1. Categoría del Evento Agudo'}
              </label>
              <select
                value={redFlagType}
                onChange={(e) => {
                  hasUserEditedRef.current = true;
                  setRedFlagType(e.target.value);
                  setCheckedFlags({});
                  setAbcdeDone({});
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key || 'initial'} value={key}>
                    {isEn ? cfg.label.en : cfg.label.es}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                {isEn ? '2. Observed Red Flags (Real-time)' : '2. Banderas Rojas Observadas (Tiempo Real)'}
              </p>
              <div className="space-y-2">
                {activeConfig.redFlags.map((rf) => {
                  const checked = Boolean(checkedFlags[rf.id]);
                  return (
                    <label
                      key={rf.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          hasUserEditedRef.current = true;
                          setCheckedFlags((prev) => ({ ...prev, [rf.id]: e.target.checked }));
                        }}
                        className="accent-rose-600 w-4 h-4 shrink-0"
                      />
                      <span>{isEn ? rf.en : rf.es}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {isEn ? 'Onset (T0)' : 'Inicio (T0)'}
                </label>
                <input
                  type="text"
                  value={onsetTime}
                  placeholder={isEn ? 'e.g. 14:22 UTC' : 'Ej. 14:22 UTC'}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setOnsetTime(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Glasgow (GCS)
                </label>
                <select
                  value={gcsScore}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setGcsScore(e.target.value);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">{isEn ? 'Not set' : 'Sin dato'}</option>
                  {Array.from({ length: 13 }, (_, idx) => 15 - idx).map((v) => (
                    <option key={v} value={String(v)}>
                      {v}/15 {v === 15 ? (isEn ? '(Alert)' : '(Alerta)') : v <= 8 ? (isEn ? '(Coma)' : '(Coma)') : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {isEn ? 'Destination' : 'Destino'}
                </label>
                <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 truncate" title={`MCC Flight Surgeon · ${environment?.name || 'ISS'}`}>
                  MCC · {environment?.id?.toUpperCase() || 'ISS'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                {isEn ? 'Clinical Notes / Countermeasure Response' : 'Notas Clínicas / Respuesta a Contramedida'}
              </label>
              <textarea
                rows={2}
                value={customNotes}
                placeholder={
                  isEn
                    ? 'Medication given, airway findings, POCUS observations...'
                    : 'Fármaco administrado, hallazgos en vía aérea o POCUS...'
                }
                onChange={(e) => {
                  hasUserEditedRef.current = true;
                  setCustomNotes(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                {isEn ? 'Attached Telemetry Snapshot' : 'Telemetría Adjunta al Paquete'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachedPills.map((pill) => (
                  <div key={pill.label} className={`px-2.5 py-2 rounded-xl border text-xs ${pill.cls}`}>
                    <span className="block text-[10px] font-semibold uppercase opacity-80">{pill.label}</span>
                    <span className="font-bold tabular-nums">{pill.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Derecha: Guía de estabilización dinámica a pie de litera */}
          <div className="md:col-span-6 p-5 bg-slate-50/60 overflow-y-auto flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {isEn ? 'Bedside Stabilization Checklist' : 'Guía de Estabilización a Pie de Litera'}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                  {Object.values(abcdeDone).filter(Boolean).length}/{activeConfig.steps.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {activeConfig.steps.map((st, idx) => {
                  const done = Boolean(abcdeDone[st.id]);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setAbcdeDone((prev) => ({ ...prev, [st.id]: !prev[st.id] }));
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-sky-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold ${
                          done
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {done ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </span>
                      <span className={`text-xs leading-relaxed ${done ? 'line-through opacity-80' : 'font-medium'}`}>
                        {isEn ? st.en : st.es}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {isEn ? 'Store-and-Forward Telemetry Integrity' : 'Integridad Store-and-Forward Carril 2'}
                </span>
              </div>
              <p>
                {isEn
                  ? `Packets update live as entries change and queue locally when RTT (${rttSeconds}s) prevents synchronous ground voice consult.`
                  : `Los paquetes se actualizan en tiempo real conforme ingresas datos y se encolan localmente cuando el retardo RTT (${rttSeconds}s) impide telemedicina síncrona con Tierra.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
