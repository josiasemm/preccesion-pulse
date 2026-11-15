import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Info,
  Plus,
  RotateCcw,
  Send,
  Stethoscope,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import AnatomySvg from './AnatomySvg';
import TrendChart from './TrendChart';
import { TRANSLATIONS } from '../i18n';

function formatEnvLabel(envId, isEn = false) {
  const id = (envId || 'iss').toLowerCase();
  const labels = {
    iss: 'ISS · LEO',
    iss_leo: 'ISS · LEO',
    transit: isEn ? 'Mars Transit' : 'Tránsito Marte',
    mars_transit: isEn ? 'Mars Transit' : 'Tránsito Marte',
    lunar: isEn ? 'Lunar Base' : 'Base Lunar',
    lunar_surface: isEn ? 'Lunar Base' : 'Base Lunar',
    mars: isEn ? 'Mars Habitat' : 'Hábitat Marte',
    mars_base: isEn ? 'Mars Base' : 'Base Marciana',
    mars_surface: isEn ? 'Mars Habitat' : 'Hábitat Marte',
    rover: isEn ? 'Rover (EVA / Pressurized)' : 'Rover Presurizado',
    eva: isEn ? 'EVA Suit' : 'Traje EVA',
    eva_suit: isEn ? 'EVA Suit' : 'Traje EVA',
  };
  return labels[id] || envId?.toUpperCase() || 'ISS';
}

function getColors(state, isEn = false) {
  if (state === 'critical') {
    return {
      fill: '#fecdd3',
      stroke: '#e11d48',
      dot: 'bg-rose-500',
      text: 'text-rose-700',
      card: 'bg-rose-50/90 border-rose-300',
      label: isEn ? 'CRITICAL' : 'CRÍTICO',
    };
  }
  if (state === 'caution') {
    return {
      fill: '#fde68a',
      stroke: '#d97706',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      card: 'bg-amber-50/90 border-amber-300',
      label: isEn ? 'CAUTION' : 'PRECAUCIÓN',
    };
  }
  return {
    fill: '#d1fae5',
    stroke: '#059669',
    dot: 'bg-emerald-500',
    text: 'text-slate-900',
    card: 'bg-slate-50/80 border-slate-200/75',
    label: 'NOMINAL',
  };
}

export default function BodyMapSvg({
  zones = {},
  selectedZone,
  onSelectZone,
  environment,
  models = {},
  telemetry = {},
  history = [],
  emergencyQueue = [],
  onSyncQueue,
  onClearHistory,
  onClearTransmittedQueue,
  onResetNominal,
  onImportTelemetry,
  onOpenVitalsInput,
  onOpenSymptoms,
  onOpenToolModal,
  onOpenProtocol,
  liveStream = true,
  onToggleLive,
  lang = 'es',
}) {
  const [inspectZone, setInspectZone] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showTrend, setShowTrend] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!inspectZone) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setInspectZone(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectZone]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const isEn = lang === 'en';

  const gRatio = environment?.g_ratio ?? 0;
  const hydro = models.hydrostatics_and_fluids || {};
  const co2 = models.cabin_co2_and_alveolar || {};
  const rad = models.radiation_and_lymphocytes || {};
  const bone = models.bone_and_renal || {};
  const neuro = models.neuro_and_anxiety || {};

  const headCol = getColors(zones.head_neuro_ocular, isEn);
  const thoraxCol = getColors(zones.thorax_cardio_resp, isEn);
  const boneCol = getColors(zones.musculoskeletal_renal, isEn);
  const sysCol = getColors(zones.systemic_radiation_immune, isEn);

  const activeZoneKey = hoveredZone || inspectZone || selectedZone || null;

  const handleZoneClick = (zoneKey) => {
    onSelectZone?.(zoneKey);
    setInspectZone((prev) => (prev === zoneKey ? null : zoneKey));
  };

  const renderZoneDetail = (zoneKey) => {
    switch (zoneKey) {
      case 'head_neuro_ocular':
        return {
          title: t.zHead,
          lines: [
            isEn
              ? `Hydrostatic ΔP lost: ${hydro.cephalad_pressure_shift_mmhg ?? 0} mmHg toward cranium.`
              : `ΔP Hidrostática perdida: ${hydro.cephalad_pressure_shift_mmhg ?? 0} mmHg hacia el cráneo.`,
            `ONSD: ${telemetry.onsd_measured_mm ?? '—'} mm · ΔTRT250: +${hydro.oct_trt250_delta_um ?? telemetry.oct_trt250_delta_um ?? 0} µm · IOP: ${telemetry.iop_mmhg ?? 15} mmHg · HRV: ${neuro.hrv_drop_pct ?? 0}%`,
            neuro.organic_mimics_detected?.length
              ? `${isEn ? 'Active organic mimic' : 'Imitador físico activo'}: ${neuro.organic_mimics_detected.join(', ')}`
              : isEn
              ? 'No organic anxiety mimics detected.'
              : 'Sin imitadores orgánicos de ansiedad detectados.',
          ],
          actions: [
            { label: isEn ? 'Start PVT' : 'Iniciar PVT', onClick: () => onOpenToolModal?.('pvt') },
            { label: isEn ? 'Open Amsler' : 'Abrir Amsler', onClick: () => onOpenToolModal?.('amsler') },
            { label: isEn ? 'SANS Protocol' : 'Protocolo SANS', onClick: () => onOpenProtocol?.('thigh_cuff_sans') },
          ],
        };
      case 'thorax_cardio_resp':
        return {
          title: t.zThorax,
          lines: [
            `ppCO₂: ${co2.current_ppco2_mmhg ?? '—'} mmHg (${isEn ? 'limit' : 'límite'} 3.0) · 4h: ${co2.projected_ppco2_4h_mmhg ?? '—'} mmHg`,
            `${isEn ? 'Estimated alveolar PAO₂' : 'PAO₂ alveolar estimada'}: ${co2.estimated_alveolar_po2_mmhg ?? '—'} mmHg`,
            environment?.available_hardware?.includes('LBNP')
              ? `${isEn ? 'LBNP Lock' : 'Candado LBNP'}: ${
                  hydro.lbnp_safe
                    ? isEn
                      ? 'Unlocked (Safe with monitoring)'
                      : 'Desbloqueado (Apto bajo monitoreo)'
                    : isEn
                    ? 'LOCKED for safety'
                    : 'BLOQUEADO por seguridad'
                }`
              : isEn
              ? 'No LBNP hardware in this vehicle (use Thigh Cuffs).'
              : 'Sin LBNP en este vehículo (usar Thigh Cuffs).',
          ],
          actions: [
            { label: isEn ? 'Resp / O₂ Protocol' : 'Protocolo Resp. / O₂', onClick: () => onOpenProtocol?.('eva_dcs_hypoxia') },
            ...((co2.current_ppco2_mmhg ?? 0) > 3.0 || (neuro.organic_mimics_detected?.length ?? 0) > 0
              ? [
                  {
                    label: isEn ? 'ppCO₂ Trend' : 'Tendencia ppCO₂',
                    onClick: () => {
                      setInspectZone(null);
                      setShowTrend(true);
                      onSelectZone?.(null);
                    },
                  },
                ]
              : [{ label: isEn ? 'Breathe 0.1 Hz' : 'Respirar 0.1 Hz', onClick: () => onOpenToolModal?.('breathing') }]),
          ],
        };
      case 'musculoskeletal_renal':
        return {
          title: t.zBone,
          lines: [
            `${isEn ? 'Monthly BMD loss' : 'Pérdida DMO mensual'}: ${bone.monthly_bmd_loss_pct ?? 0}%/mo · T-score: ${bone.projected_bmd_tscore ?? '—'}`,
            `${isEn ? 'Renal Supersaturation Index' : 'Índice Sobresaturación Renal'}: ${bone.renal_supersaturation_index ?? '—'}`,
          ],
          actions: [
            { label: isEn ? 'Renal POCUS Protocol' : 'Protocolo Litiasis / DMO', onClick: () => onOpenProtocol?.('renal_stone_pocus') },
          ],
        };
      case 'systemic_radiation_immune':
      default:
        return {
          title: t.zSys,
          lines: [
            `${isEn ? 'Effective SPE (BFO)' : 'Dosis SPE efectiva (BFO)'}: ${rad.effective_spe_bfo_mgyeq ?? 0} mGy-Eq · ${isEn ? 'Shielding' : 'Blindaje'}: ${rad.shielding_areal_density_g_cm2 ?? '—'} g/cm²`,
            `${isEn ? 'Career dose' : 'Carrera acumulada'}: ${rad.total_career_dose_msv ?? 0} / 600 mSv · ALC: ${rad.predicted_alc_cells_ul ?? '—'} cél/µL`,
          ],
          actions: [
            { label: isEn ? 'SPE Shelter Protocol' : 'Protocolo Radiación SPE', onClick: () => onOpenProtocol?.('spe_storm_shelter') },
          ],
        };
    }
  };

  const spo2Status =
    telemetry.spo2_percent < 90 ? 'critical' : telemetry.spo2_percent < 94 ? 'caution' : 'nominal';
  const hrStatus =
    telemetry.heart_rate_bpm > 130 || telemetry.heart_rate_bpm < 40
      ? 'critical'
      : telemetry.heart_rate_bpm > 110 || telemetry.heart_rate_bpm < 45
      ? 'caution'
      : 'nominal';
  const sbp = telemetry.systolic_bp ?? 118;
  const dbp = telemetry.diastolic_bp ?? 76;
  const bpStatus =
    sbp >= 150 || sbp < 90 || dbp >= 95
      ? 'critical'
      : sbp >= 140 || sbp < 95 || dbp >= 90
      ? 'caution'
      : 'nominal';
  const glucStatus =
    telemetry.glucose_mg_dl < 70 || telemetry.glucose_mg_dl >= 250
      ? 'critical'
      : telemetry.glucose_mg_dl > 125
      ? 'caution'
      : 'nominal';
  const pvtStatus =
    neuro.pvt_status === 'critical'
      ? 'critical'
      : neuro.pvt_status === 'caution'
      ? 'caution'
      : 'nominal';

  const clampPct = (val, max) => Math.max(4, Math.min(100, Math.round((val / max) * 100)));

  const vitals = [
    {
      id: 'ppco2',
      zone: 'thorax_cardio_resp',
      label: t.vPpco2,
      valueMain: telemetry.cabin_ppco2_mmhg ?? '—',
      unit: 'mmHg',
      limit: '≤ 3.0',
      pct: clampPct(Number(telemetry.cabin_ppco2_mmhg ?? 2.1), 5.0),
      style: getColors(co2.co2_status || 'nominal', isEn),
    },
    {
      id: 'spo2',
      zone: 'thorax_cardio_resp',
      label: t.vSpo2,
      valueMain: telemetry.spo2_percent ?? '—',
      unit: '%',
      limit: '≥ 94%',
      pct: clampPct(Math.max(0, Number(telemetry.spo2_percent ?? 98) - 80), 20),
      style: getColors(spo2Status, isEn),
    },
    {
      id: 'hr',
      zone: 'thorax_cardio_resp',
      label: t.vHr,
      valueMain: telemetry.heart_rate_bpm ?? '—',
      unit: isEn ? 'bpm' : 'lpm',
      limit: '45–110',
      pct: clampPct(Number(telemetry.heart_rate_bpm ?? 68), 140),
      style: getColors(hrStatus, isEn),
    },
    {
      id: 'bp',
      zone: 'thorax_cardio_resp',
      label: isEn ? 'Blood Press.' : 'PAS / PAD',
      valueMain: `${Math.round(sbp)}/${Math.round(dbp)}`,
      unit: 'mmHg',
      limit: '< 140/90',
      pct: clampPct(sbp, 180),
      style: getColors(bpStatus, isEn),
    },
    {
      id: 'onsd',
      zone: 'head_neuro_ocular',
      label: t.vOnsd,
      valueMain: telemetry.onsd_measured_mm ?? '—',
      unit: 'mm',
      limit: '< 5.0',
      pct: clampPct(Number(telemetry.onsd_measured_mm ?? 4.3), 6.5),
      style: getColors(hydro.sans_risk || 'nominal', isEn),
    },
    {
      id: 'glucose',
      zone: 'systemic_radiation_immune',
      label: t.vGlucose,
      valueMain: telemetry.glucose_mg_dl ?? '—',
      unit: 'mg/dL',
      limit: '70–125',
      pct: clampPct(Number(telemetry.glucose_mg_dl ?? 92), 160),
      style: getColors(glucStatus, isEn),
    },
    {
      id: 'pvt',
      zone: 'head_neuro_ocular',
      label: t.vPvt,
      valueMain: telemetry.pvt_mean_rt_ms ?? '—',
      unit: 'ms',
      limit: '< 280',
      pct: clampPct(Number(telemetry.pvt_mean_rt_ms ?? 248), 500),
      style: getColors(pvtStatus, isEn),
    },
    {
      id: 'rad',
      zone: 'systemic_radiation_immune',
      label: t.vRad,
      valueMain: rad.effective_spe_bfo_mgyeq ?? 0,
      unit: 'mGy-Eq',
      limit: '< 250',
      pct: clampPct(Number(rad.effective_spe_bfo_mgyeq ?? 0), 400),
      style: getColors(rad.rad_status || 'nominal', isEn),
    },
    {
      id: 'bone',
      zone: 'musculoskeletal_renal',
      label: t.vBone,
      valueMain: bone.monthly_bmd_loss_pct ?? 0,
      unit: `%/${isEn ? 'mo' : 'mes'}`,
      limit: `< 0.75%/${isEn ? 'mo' : 'mes'}`,
      pct: clampPct(Number(bone.monthly_bmd_loss_pct ?? 0.58), 2.0),
      style: getColors(bone.bone_renal_status || 'nominal', isEn),
    },
  ];

  const ZONE_NAMES = {
    head_neuro_ocular: t.zHead,
    thorax_cardio_resp: t.zThorax,
    musculoskeletal_renal: t.zBone,
    systemic_radiation_immune: t.zSys,
  };

  const detail = inspectZone ? renderZoneDetail(inspectZone) : null;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col justify-between gap-3">
      {/* Barra superior discreta: Fluid Shift + Live Pulse + Toggle Tendencia ppCO2 */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {gRatio === 0 ? (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {t.fluidShift0g} · <strong className="text-slate-700">0g</strong> ({hydro.plasma_volume_change_pct ?? 0}% {t.plasma})
                </span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {t.fluidShiftPartial} · <strong className="text-slate-700">{gRatio}g</strong> ({hydro.plasma_volume_change_pct ?? 0}% {t.plasma})
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleLive}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            title={isEn ? 'Toggle real-time physics step (dt)' : 'Activar/pausar integración física en vivo (dt)'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                liveStream ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{liveStream ? t.liveOn : t.livePaused}</span>
          </button>

          {onResetNominal && (
            <button
              type="button"
              onClick={onResetNominal}
              title={isEn ? 'Reset to nominal baseline' : 'Restablecer telemetría nominal'}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{isEn ? 'Reset' : 'Reiniciar'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTrend((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            showTrend
              ? 'bg-sky-50 text-sky-800'
              : 'text-slate-600 hover:text-sky-800 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{showTrend ? t.showBody : t.showTrend}</span>
        </button>
      </div>

      {/* Contenido Principal: Ser Humano Centrado + Cuadrito limpio abajo con los 9 datos individuales */}
      {showTrend ? (
        <div className="flex-1 min-h-0 flex flex-col justify-start gap-4 py-2 overflow-y-auto pr-1">
          <TrendChart history={history} lang={lang} />
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {isEn ? 'Recent Evaluations Log (SQLite)' : 'Bitácora Reciente (SQLite)'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-600 tabular-nums">
                  {history.length} {isEn ? 'records' : 'registros'}
                </span>
                {history.length > 0 && onClearHistory && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 cursor-pointer"
                    title={isEn ? 'Clear telemetry log' : 'Limpiar bitácora'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isEn ? 'Clear' : 'Limpiar'}</span>
                  </button>
                )}
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-slate-600">
                {isEn ? 'No evaluations recorded yet.' : 'Aún no hay evaluaciones registradas.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.slice(0, 6).map((item) => {
                  const st = getColors(item.global_status, isEn);
                  const timeStr = item.created_at
                    ? new Date(item.created_at).toLocaleTimeString(isEn ? 'en-US' : 'es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';
                  const tel = item.telemetry || {};
                  return (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <span className="font-mono text-[11px] text-slate-600 shrink-0">{timeStr}</span>
                        <span className="font-medium text-slate-700 truncate">
                          {formatEnvLabel(item.environment_id, isEn)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 tabular-nums shrink-0">
                        <span>ppCO₂ {tel.cabin_ppco2_mmhg ?? '—'}</span>
                        <span>
                          SpO₂{' '}
                          {tel.spo2_percent != null
                            ? `${Math.round(tel.spo2_percent)}%`
                            : tel.spo2_pct != null
                            ? `${Math.round(tel.spo2_pct)}%`
                            : '—'}
                        </span>
                        <span>
                          {tel.systolic_bp ? `${Math.round(tel.systolic_bp)}/${Math.round(tel.diastolic_bp || 76)}` : '—'}
                        </span>
                        <span className={`font-semibold uppercase ${st.text}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cola Store-and-Forward Carril 2 */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {isEn ? 'Lane 2 Queue (Store-and-Forward)' : 'Cola Carril 2 (Store-and-Forward)'}
              </span>
              <div className="flex items-center gap-3">
                {emergencyQueue.some((p) => p.status !== 'QUEUED_FOR_EARTH_LINK') && onClearTransmittedQueue && (
                  <button
                    type="button"
                    onClick={onClearTransmittedQueue}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 cursor-pointer"
                    title={isEn ? 'Clear transmitted packets' : 'Limpiar paquetes transmitidos'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isEn ? 'Clear transmitted' : 'Limpiar transmitidos'}</span>
                  </button>
                )}
                {emergencyQueue.some((p) => p.status === 'QUEUED_FOR_EARTH_LINK') && onSyncQueue && (
                  <button
                    type="button"
                    onClick={onSyncQueue}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isEn ? 'Sync to Earth (MCC)' : 'Sincronizar con Tierra'}</span>
                  </button>
                )}
              </div>
            </div>
            {emergencyQueue.length === 0 ? (
              <p className="text-xs text-slate-600">
                {isEn ? 'No emergency packets queued.' : 'Sin paquetes de emergencia encolados.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {emergencyQueue.slice(0, 5).map((pkt) => {
                  const queued = pkt.status === 'QUEUED_FOR_EARTH_LINK';
                  return (
                    <div key={pkt.packet_id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 block truncate">
                          #{pkt.packet_id} · {pkt.event_type}
                        </span>
                        <span className="text-[10.5px] text-slate-600">
                          RTT {pkt.rtt_seconds}s
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          queued
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {queued
                          ? isEn
                            ? 'Queued'
                            : 'En espera'
                          : isEn
                          ? 'Transmitted'
                          : 'Transmitido'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch py-1">
          {/* Izquierda: Silueta anatómica a máxima altura */}
          <div className="md:col-span-6 h-full flex flex-col items-center justify-center min-h-0">
            <AnatomySvg
              headCol={headCol}
              thoraxCol={thoraxCol}
              boneCol={boneCol}
              sysCol={sysCol}
              activeZoneKey={activeZoneKey}
              onSelectZone={handleZoneClick}
              onHoverZone={setHoveredZone}
              lang={lang}
              className="w-full h-[calc(100vh-260px)] min-h-[350px] max-h-[580px] select-none"
            />
            <span className="text-[11px] font-medium text-slate-600 mt-1 text-center leading-tight">
              {hoveredZone ? `${ZONE_NAMES[hoveredZone]} · ${t.clickToInspect}` : t.touchHint}
            </span>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {[
                { key: 'head_neuro_ocular', label: isEn ? 'Head' : 'Cabeza', status: zones.head_neuro_ocular, col: headCol },
                { key: 'thorax_cardio_resp', label: isEn ? 'Thorax' : 'Tórax', status: zones.thorax_cardio_resp, col: thoraxCol },
                { key: 'musculoskeletal_renal', label: isEn ? 'Bone/Renal' : 'Óseo/Renal', status: zones.musculoskeletal_renal, col: boneCol },
                { key: 'systemic_radiation_immune', label: isEn ? 'Systemic' : 'Sistémico', status: zones.systemic_radiation_immune, col: sysCol },
              ].map((z) => {
                const statusGlyph = z.status === 'critical' ? '!' : z.status === 'caution' ? '△' : '✓';
                return (
                  <button
                    key={z.key}
                    type="button"
                    title={`${z.label}: ${z.col.label}`}
                    aria-label={`${z.label}: ${z.col.label}`}
                    onClick={() => handleZoneClick(z.key)}
                    onMouseEnter={() => setHoveredZone(z.key)}
                    onMouseLeave={() => setHoveredZone(null)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-medium transition-colors cursor-pointer ${
                      activeZoneKey === z.key
                        ? 'border-sky-500 bg-sky-50 text-sky-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${z.col.dot}`} aria-hidden="true" />
                    <span>{z.label}</span>
                    {z.status && z.status !== 'nominal' && (
                      <span className={`text-[9.5px] font-extrabold ${z.col.text}`} aria-hidden="true">
                        {statusGlyph}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Derecha: Variante 3B (2x5 a altura completa con rango NASA-STD-3001) */}
          <div className="md:col-span-6 h-full flex flex-col min-h-0 py-1">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 shrink-0 flex-wrap">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                {t.vitalsHeader}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onOpenSymptoms && (
                  <button
                    type="button"
                    onClick={onOpenSymptoms}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[11px] font-semibold text-amber-800 cursor-pointer"
                  >
                    <Stethoscope className="w-3 h-3" />
                    <span>{t.reportSymptom}</span>
                  </button>
                )}
                {onImportTelemetry && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImportTelemetry(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={isEn ? 'Import CSV or JSON telemetry' : 'Importar telemetría real desde CSV o JSON'}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isEn ? 'Import' : 'Importar'}</span>
                    </button>
                  </>
                )}
                {onOpenVitalsInput && (
                  <button
                    type="button"
                    onClick={onOpenVitalsInput}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0369a1] hover:bg-sky-800 text-[11px] font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.registerMeasurement}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 grid-rows-5 gap-2.5 pt-2.5 min-h-0">
              {vitals.map((v, idx) => {
                const isLast = idx === vitals.length - 1;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onMouseEnter={() => setHoveredZone(v.zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    onClick={() => handleZoneClick(v.zone)}
                    className={`text-left p-3 rounded-xl border transition-colors flex flex-col justify-between cursor-pointer hover:border-sky-400 hover:bg-white ${v.style.card} ${
                      isLast ? 'col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-[11px] font-medium text-slate-600 truncate">
                        {v.label}
                      </span>
                      <span className={`text-[10px] font-semibold shrink-0 ${v.style.text}`}>
                        {v.limit}
                      </span>
                    </div>
                    <div className={`flex items-baseline justify-between gap-2 w-full ${isLast ? 'mt-0.5' : ''}`}>
                      <div className="text-base xl:text-lg font-bold text-slate-900 tabular-nums leading-tight">
                        {v.valueMain}{' '}
                        <span className="text-[11px] font-medium text-slate-500">{v.unit}</span>
                      </div>
                      {isLast && (
                        <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full transition-all ${v.style.dot}`}
                            style={{ width: `${v.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${v.style.dot}`}
                          style={{ width: `${v.pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popover flotante limpio con acciones directas al tocar una zona */}
      {detail && !showTrend && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Info className="w-3.5 h-3.5 text-sky-600" />
              <span>{detail.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setInspectZone(null)}
              aria-label={isEn ? 'Close zone details' : 'Cerrar detalle de zona'}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11.5px] text-slate-600 space-y-0.5 leading-snug">
            {detail.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {detail.actions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-slate-100">
              {detail.actions.map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => {
                    setInspectZone(null);
                    act.onClick();
                  }}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {act.label} →
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
