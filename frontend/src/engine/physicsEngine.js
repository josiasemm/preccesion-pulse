/**
 * Motor Biofísico y Clínico Acoplado (EIMO — Engine for In-Flight Medical Operations).
 * Paridad 1:1 con backend/physics_engine.py para ejecución determinista offline-first en navegador.
 */

import { G0, SHIELDING_POSTURES, getEnvironment, isHardwareAvailable } from './swapMatrix.js';

export const RHO_BLOOD_KG_M3 = 1060.0;
export const PA_PER_MMHG = 133.322;
export const HEAD_HEART_DIST_M = 0.35;
export const TAU_PLASMA_DAYS = 2.5;

export const LIMIT_PPCO2_MMHG = 3.0;
export const LIMIT_NOISE_CAUTION_DBA = 60.0;
export const LIMIT_NOISE_CRITICAL_DBA = 85.0;
export const LIMIT_RAD_CAREER_MSV = 600.0;
export const LIMIT_BFO_30D_MGYEQ = 250.0;
export const LIMIT_BFO_1YR_MGYEQ = 500.0;
export const PVT_LAPSE_THRESHOLD_MS = 355;

const VALID_ENVS = new Set(['iss', 'transit', 'rover', 'mars_base']);
const VALID_POSTURES = new Set(['eva', 'nominal', 'storm_shelter']);

function roundTo(value, decimals = 0) {
  const factor = 10 ** decimals;
  const rounded = Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clampNumber(value, fallback, min, max, isInt = false) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.min(max, Math.max(min, parsed));
  return isInt ? Math.round(clamped) : clamped;
}

function clampString(value, fallback, maxLen) {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLen);
}

export const DEFAULT_BASELINE_PROFILE = {
  callsign: 'Cmdr. Josías M.',
  role: 'Oficial Médico de Tripulación (CMO)',
  birth_date: '2000-05-15',
  age: 26,
  sex: 'M',
  weight_kg: 72.0,
  height_cm: 175.0,
  blood_type: 'O+',
  allergies: 'Ninguna',
  active_meds: ['Complejo B'],
  uses_glasses: false,
  baseline_refraction_diopters: 0.0,
  amb_waiver_renal: false,
  amb_waiver_orthostatic_or_arrhythmia: false,
  hr_baseline_bpm: 64.0,
  hrv_baseline_ms: 48.0,
  systolic_bp_baseline: 115.0,
  diastolic_bp_baseline: 74.0,
  onsd_baseline_mm: 4.2,
  iop_baseline_mmhg: 14.0,
  oct_trt250_baseline_um: 340.0,
  bmd_tscore_baseline: 0.2,
  pvt_baseline_ms: 235.0,
  alc_baseline_cells_ul: 2100.0,
  prior_career_rad_msv: 18.0,
  mission_day: 45,
  launch_date: null,
  auto_advance_mission_day: true,
};

export function normalizeBaselineProfile(raw = {}) {
  const d = DEFAULT_BASELINE_PROFILE;
  const src = raw && typeof raw === 'object' ? raw : {};
  const activeMeds = Array.isArray(src.active_meds)
    ? src.active_meds.map((m) => String(m)).filter(Boolean)
    : [...d.active_meds];

  return {
    callsign: clampString(src.callsign, d.callsign, 80),
    role: clampString(src.role, d.role, 100),
    birth_date: typeof src.birth_date === 'string' && src.birth_date.trim() ? src.birth_date.trim() : src.birth_date === null ? null : d.birth_date,
    age: clampNumber(src.age, d.age, 18, 90, true),
    sex: clampString(src.sex, d.sex, 16),
    weight_kg: clampNumber(src.weight_kg, d.weight_kg, 35.0, 200.0),
    height_cm: clampNumber(src.height_cm, d.height_cm, 120.0, 230.0),
    blood_type: clampString(src.blood_type, d.blood_type, 8),
    allergies: clampString(src.allergies, d.allergies, 200),
    active_meds: activeMeds,
    uses_glasses: Boolean(src.uses_glasses ?? d.uses_glasses),
    baseline_refraction_diopters: clampNumber(src.baseline_refraction_diopters, d.baseline_refraction_diopters, -15.0, 15.0),
    amb_waiver_renal: Boolean(src.amb_waiver_renal ?? d.amb_waiver_renal),
    amb_waiver_orthostatic_or_arrhythmia: Boolean(src.amb_waiver_orthostatic_or_arrhythmia ?? d.amb_waiver_orthostatic_or_arrhythmia),
    hr_baseline_bpm: clampNumber(src.hr_baseline_bpm, d.hr_baseline_bpm, 30.0, 140.0),
    hrv_baseline_ms: clampNumber(src.hrv_baseline_ms, d.hrv_baseline_ms, 5.0, 250.0),
    systolic_bp_baseline: clampNumber(src.systolic_bp_baseline, d.systolic_bp_baseline, 70.0, 200.0),
    diastolic_bp_baseline: clampNumber(src.diastolic_bp_baseline, d.diastolic_bp_baseline, 40.0, 130.0),
    onsd_baseline_mm: clampNumber(src.onsd_baseline_mm, d.onsd_baseline_mm, 2.5, 8.0),
    iop_baseline_mmhg: clampNumber(src.iop_baseline_mmhg, d.iop_baseline_mmhg, 5.0, 45.0),
    oct_trt250_baseline_um: clampNumber(src.oct_trt250_baseline_um, d.oct_trt250_baseline_um, 150.0, 600.0),
    bmd_tscore_baseline: clampNumber(src.bmd_tscore_baseline, d.bmd_tscore_baseline, -5.0, 5.0),
    pvt_baseline_ms: clampNumber(src.pvt_baseline_ms, d.pvt_baseline_ms, 120.0, 600.0),
    alc_baseline_cells_ul: clampNumber(src.alc_baseline_cells_ul, d.alc_baseline_cells_ul, 200.0, 8000.0),
    prior_career_rad_msv: clampNumber(src.prior_career_rad_msv, d.prior_career_rad_msv, 0.0, 2000.0),
    mission_day: clampNumber(src.mission_day, d.mission_day, 0, 50000, true),
    launch_date: typeof src.launch_date === 'string' && src.launch_date.trim() ? src.launch_date.trim() : null,
    auto_advance_mission_day: src.auto_advance_mission_day !== undefined ? Boolean(src.auto_advance_mission_day) : d.auto_advance_mission_day,
  };
}

export const DEFAULT_TELEMETRY_INPUT = {
  environment_id: 'iss',
  shielding_posture: 'nominal',
  is_pre_sleep_window: false,
  is_planetary_descent_soon: false,
  cabin_ppco2_mmhg: 2.1,
  cabin_pressure_psia: 14.7,
  cabin_o2_percent: 21.0,
  cdra_scrubber_efficiency: 0.95,
  crew_count: 4,
  spe_event_dose_mgyeq: 0.0,
  hours_since_spe: 24.0,
  time_to_emesis_hours: null,
  cabin_noise_dba: 58.0,
  heart_rate_bpm: 68.0,
  hrv_rmssd_ms: 44.0,
  systolic_bp: 118.0,
  diastolic_bp: 76.0,
  spo2_percent: 98.0,
  resp_rate_rpm: 14.0,
  temp_celsius: 36.7,
  onsd_measured_mm: 4.3,
  oct_trt250_delta_um: 4.0,
  oct_rnfl_delta_um: null,
  iop_mmhg: 15.0,
  amsler_distortions: 0,
  near_acuity: '20/20',
  pocus_dvt_suspicion: false,
  ecg_arrhythmia_detected: false,
  exercise_adherence_ratio: 0.9,
  alendronate_active: false,
  potassium_citrate_active: false,
  water_intake_liters: 2.4,
  urine_output_liters: 2.0,
  urine_specific_gravity: 1.014,
  ionized_calcium_mmol_l: 1.22,
  flank_pain: false,
  sleep_hours: 7.2,
  sleep_efficiency_pct: 89.0,
  sleep_onset_latency_min: 18.0,
  pvt_mean_rt_ms: 248.0,
  pvt_lapses: 0,
  anxiety_vas: 2,
  gad2_score: 0,
  audiometry_shift_4khz_db: 5.0,
  glucose_mg_dl: 92.0,
  skin_rash_or_viral_symptoms: false,
};

export function normalizeTelemetryInput(raw = {}) {
  const d = DEFAULT_TELEMETRY_INPUT;
  const src = raw && typeof raw === 'object' ? raw : {};

  return {
    environment_id: VALID_ENVS.has(src.environment_id) ? src.environment_id : d.environment_id,
    shielding_posture: VALID_POSTURES.has(src.shielding_posture) ? src.shielding_posture : d.shielding_posture,
    is_pre_sleep_window: Boolean(src.is_pre_sleep_window ?? d.is_pre_sleep_window),
    is_planetary_descent_soon: Boolean(src.is_planetary_descent_soon ?? d.is_planetary_descent_soon),
    cabin_ppco2_mmhg: clampNumber(src.cabin_ppco2_mmhg, d.cabin_ppco2_mmhg, 0.0, 30.0),
    cabin_pressure_psia: clampNumber(src.cabin_pressure_psia, d.cabin_pressure_psia, 4.0, 18.0),
    cabin_o2_percent: clampNumber(src.cabin_o2_percent, d.cabin_o2_percent, 10.0, 100.0),
    cdra_scrubber_efficiency: clampNumber(src.cdra_scrubber_efficiency, d.cdra_scrubber_efficiency, 0.0, 1.0),
    crew_count: clampNumber(src.crew_count, d.crew_count, 1, 20, true),
    spe_event_dose_mgyeq: clampNumber(src.spe_event_dose_mgyeq, d.spe_event_dose_mgyeq, 0.0, 10000.0),
    hours_since_spe: clampNumber(src.hours_since_spe, d.hours_since_spe, 0.0, 720.0),
    time_to_emesis_hours:
      src.time_to_emesis_hours === null || src.time_to_emesis_hours === undefined || src.time_to_emesis_hours === ''
        ? null
        : clampNumber(src.time_to_emesis_hours, 0.0, 0.0, 72.0),
    cabin_noise_dba: clampNumber(src.cabin_noise_dba, d.cabin_noise_dba, 20.0, 140.0),
    heart_rate_bpm: clampNumber(src.heart_rate_bpm, d.heart_rate_bpm, 20.0, 240.0),
    hrv_rmssd_ms: clampNumber(src.hrv_rmssd_ms, d.hrv_rmssd_ms, 1.0, 300.0),
    systolic_bp: clampNumber(src.systolic_bp, d.systolic_bp, 40.0, 260.0),
    diastolic_bp: clampNumber(src.diastolic_bp, d.diastolic_bp, 20.0, 160.0),
    spo2_percent: clampNumber(src.spo2_percent, d.spo2_percent, 50.0, 100.0),
    resp_rate_rpm: clampNumber(src.resp_rate_rpm, d.resp_rate_rpm, 4.0, 60.0),
    temp_celsius: clampNumber(src.temp_celsius, d.temp_celsius, 30.0, 43.0),
    onsd_measured_mm: clampNumber(src.onsd_measured_mm, d.onsd_measured_mm, 2.0, 10.0),
    oct_trt250_delta_um: clampNumber(src.oct_trt250_delta_um, d.oct_trt250_delta_um, -50.0, 300.0),
    oct_rnfl_delta_um:
      src.oct_rnfl_delta_um === null || src.oct_rnfl_delta_um === undefined || src.oct_rnfl_delta_um === ''
        ? null
        : clampNumber(src.oct_rnfl_delta_um, 0.0, -50.0, 300.0),
    iop_mmhg: clampNumber(src.iop_mmhg, d.iop_mmhg, 4.0, 60.0),
    amsler_distortions: clampNumber(src.amsler_distortions, d.amsler_distortions, 0, 80, true),
    near_acuity: clampString(src.near_acuity, d.near_acuity, 16),
    pocus_dvt_suspicion: Boolean(src.pocus_dvt_suspicion ?? d.pocus_dvt_suspicion),
    ecg_arrhythmia_detected: Boolean(src.ecg_arrhythmia_detected ?? d.ecg_arrhythmia_detected),
    exercise_adherence_ratio: clampNumber(src.exercise_adherence_ratio, d.exercise_adherence_ratio, 0.0, 1.0),
    alendronate_active: Boolean(src.alendronate_active ?? d.alendronate_active),
    potassium_citrate_active: Boolean(src.potassium_citrate_active ?? d.potassium_citrate_active),
    water_intake_liters: clampNumber(src.water_intake_liters, d.water_intake_liters, 0.0, 10.0),
    urine_output_liters: clampNumber(src.urine_output_liters, d.urine_output_liters, 0.0, 10.0),
    urine_specific_gravity: clampNumber(src.urine_specific_gravity, d.urine_specific_gravity, 1.0, 1.04),
    ionized_calcium_mmol_l: clampNumber(src.ionized_calcium_mmol_l, d.ionized_calcium_mmol_l, 0.5, 3.0),
    flank_pain: Boolean(src.flank_pain ?? d.flank_pain),
    sleep_hours: clampNumber(src.sleep_hours, d.sleep_hours, 0.0, 24.0),
    sleep_efficiency_pct: clampNumber(src.sleep_efficiency_pct, d.sleep_efficiency_pct, 0.0, 100.0),
    sleep_onset_latency_min: clampNumber(src.sleep_onset_latency_min, d.sleep_onset_latency_min, 0.0, 480.0),
    pvt_mean_rt_ms: clampNumber(src.pvt_mean_rt_ms, d.pvt_mean_rt_ms, 100.0, 3000.0),
    pvt_lapses: clampNumber(src.pvt_lapses, d.pvt_lapses, 0, 100, true),
    anxiety_vas: clampNumber(src.anxiety_vas, d.anxiety_vas, 1, 10, true),
    gad2_score: clampNumber(src.gad2_score, d.gad2_score, 0, 6, true),
    audiometry_shift_4khz_db: clampNumber(src.audiometry_shift_4khz_db, d.audiometry_shift_4khz_db, -20.0, 90.0),
    glucose_mg_dl: clampNumber(src.glucose_mg_dl, d.glucose_mg_dl, 15.0, 800.0),
    skin_rash_or_viral_symptoms: Boolean(src.skin_rash_or_viral_symptoms ?? d.skin_rash_or_viral_symptoms),
  };
}

export function resolveMissionDay(profile) {
  if (profile.auto_advance_mission_day && profile.launch_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.launch_date);
    if (m) {
      const now = new Date();
      const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const launchUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return Math.max(0, Math.floor((todayUtc - launchUtc) / 86400000));
    }
  }
  return Math.max(0, Number(profile.mission_day) || 0);
}

export function resolveAge(profile) {
  if (profile.birth_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birth_date);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const now = new Date();
      const ty = now.getFullYear();
      const tm = now.getMonth() + 1;
      const td = now.getDate();
      return Math.max(0, ty - y - (tm < mo || (tm === mo && td < d) ? 1 : 0));
    }
  }
  return Math.max(0, Number(profile.age) || 0);
}

function resolveTrt250Delta(telemetry) {
  if (telemetry.oct_trt250_delta_um !== 4.0 || telemetry.oct_rnfl_delta_um === null) {
    return Number(telemetry.oct_trt250_delta_um);
  }
  return roundTo(Number(telemetry.oct_rnfl_delta_um) * 3.65, 1);
}

export function computeHydrostaticsAndFluids(env, profile, telemetry) {
  const gEff = env.g_eff_m_s2;
  const gRatio = env.g_ratio;

  const deltaPEarthMmhg = (RHO_BLOOD_KG_M3 * G0 * HEAD_HEART_DIST_M) / PA_PER_MMHG;
  const deltaPCurrentMmhg = (RHO_BLOOD_KG_M3 * gEff * HEAD_HEART_DIST_M) / PA_PER_MMHG;
  const cephaladPressureShiftMmhg = roundTo(deltaPEarthMmhg - deltaPCurrentMmhg, 2);

  const eqLossPct = -13.0 * (1.0 - gRatio);
  const days = resolveMissionDay(profile);
  const plasmaVolumeChangePct = roundTo(eqLossPct * (1.0 - Math.exp(-days / TAU_PLASMA_DAYS)), 2);

  const onsdDelta = roundTo(telemetry.onsd_measured_mm - profile.onsd_baseline_mm, 2);
  const trt250Delta = resolveTrt250Delta(telemetry);
  let sansRisk = 'nominal';
  if (
    telemetry.amsler_distortions > 0 ||
    onsdDelta >= 0.7 ||
    telemetry.onsd_measured_mm >= 5.8 ||
    trt250Delta >= 55.0
  ) {
    sansRisk = 'critical';
  } else if (
    onsdDelta >= 0.4 ||
    telemetry.onsd_measured_mm >= 5.0 ||
    telemetry.near_acuity !== '20/20' ||
    trt250Delta >= 20.0 ||
    telemetry.iop_mmhg > 21.0
  ) {
    sansRisk = 'caution';
  }

  const hypovolemiaLock =
    telemetry.water_intake_liters < 1.5 ||
    telemetry.urine_specific_gravity >= 1.02 ||
    telemetry.systolic_bp < 95.0;
  const dvtLock = Boolean(telemetry.pocus_dvt_suspicion);
  const cardiacLock =
    Boolean(telemetry.ecg_arrhythmia_detected) ||
    Boolean(profile.amb_waiver_orthostatic_or_arrhythmia);
  const hypoglycemiaLock = telemetry.glucose_mg_dl < 70.0;
  const lbnpSafe = !(hypovolemiaLock || dvtLock || cardiacLock || hypoglycemiaLock);

  return {
    delta_p_earth_mmhg: roundTo(deltaPEarthMmhg, 2),
    delta_p_current_mmhg: roundTo(deltaPCurrentMmhg, 2),
    cephalad_pressure_shift_mmhg: cephaladPressureShiftMmhg,
    plasma_volume_change_pct: plasmaVolumeChangePct,
    onsd_delta_mm: onsdDelta,
    oct_trt250_delta_um: trt250Delta,
    sans_risk: sansRisk,
    lbnp_safe: lbnpSafe,
    lbnp_locks: {
      hypovolemia_or_dehydration: hypovolemiaLock,
      dvt_suspicion: dvtLock,
      arrhythmia_or_syncope_waiver: cardiacLock,
      hypoglycemia_syncope_risk: hypoglycemiaLock,
    },
  };
}

function cdraRatesMmhgH(env, telemetry) {
  const vCab = Math.max(env.cabin_volume_m3, 10.0);
  const designCrew = env.cdra_design_crew ?? 4;
  const metabolicGenMmhgH = (telemetry.crew_count * 18.0) / vCab;
  const nominalDesignGen = (designCrew * 18.0) / vCab;
  const co2DrivingFactor = Math.min(2.5, Math.max(0.3, telemetry.cabin_ppco2_mmhg / 2.1));
  const removalMmhgH = telemetry.cdra_scrubber_efficiency * nominalDesignGen * 1.15 * co2DrivingFactor;
  return [metabolicGenMmhgH, removalMmhgH];
}

export function computeCabinCo2AndAlveolar(env, telemetry) {
  const [metabolicGen, removal] = cdraRatesMmhgH(env, telemetry);
  const dPpco2Dt = roundTo(Math.max(-0.5, metabolicGen - removal), 3);
  const projectedPpco24h = roundTo(Math.max(0.4, telemetry.cabin_ppco2_mmhg + 4.0 * dPpco2Dt), 2);

  const pAtmMmhg = telemetry.cabin_pressure_psia * 51.7149;
  const ph2oMmhg = 47.0;
  const pio2Mmhg = Math.max(0.0, (pAtmMmhg - ph2oMmhg) * (telemetry.cabin_o2_percent / 100.0));
  const paCo2Est = 40.0 + Math.max(0.0, (telemetry.cabin_ppco2_mmhg - 0.5) * 1.4);
  const rq = 0.82;
  const pAlveolarO2Mmhg = roundTo(Math.max(0.0, pio2Mmhg - paCo2Est / rq), 1);

  const flammabilityAlert = telemetry.cabin_o2_percent >= 23.5;
  const cabinHypoxia = pio2Mmhg < 100.0;

  let co2Status = 'nominal';
  if (telemetry.cabin_ppco2_mmhg >= 5.0 || projectedPpco24h >= 6.0) {
    co2Status = 'critical';
  } else if (telemetry.cabin_ppco2_mmhg > LIMIT_PPCO2_MMHG || projectedPpco24h > LIMIT_PPCO2_MMHG) {
    co2Status = 'caution';
  }

  return {
    current_ppco2_mmhg: telemetry.cabin_ppco2_mmhg,
    limit_ppco2_mmhg: LIMIT_PPCO2_MMHG,
    d_ppco2_dt_mmhg_h: dPpco2Dt,
    projected_ppco2_4h_mmhg: projectedPpco24h,
    cabin_pressure_psia: telemetry.cabin_pressure_psia,
    cabin_o2_percent: telemetry.cabin_o2_percent,
    estimated_inspired_po2_mmhg: roundTo(pio2Mmhg, 1),
    estimated_alveolar_po2_mmhg: pAlveolarO2Mmhg,
    flammability_alert: flammabilityAlert,
    cabin_hypoxia: cabinHypoxia,
    co2_status: co2Status,
  };
}

export function computeRadiationAndLymphocytes(env, profile, telemetry) {
  const xRef = env.default_shielding_g_cm2;
  const stormShelterAvailable = (env.available_hardware || []).includes('Storm Shelter');
  const effectivePosture =
    telemetry.shielding_posture === 'storm_shelter' && !stormShelterAvailable
      ? 'nominal'
      : telemetry.shielding_posture;
  const xShield =
    effectivePosture === 'nominal' ? xRef : (SHIELDING_POSTURES[effectivePosture] ?? xRef);
  const lambdaGcr = 140.0;
  const lambdaSpe = 12.0;

  let gcrRateMsvDay = env.base_gcr_msv_day * Math.exp(-(xShield - xRef) / lambdaGcr);
  gcrRateMsvDay = roundTo(Math.max(0.15, gcrRateMsvDay), 3);

  const speAttenuation = Math.exp(-(xShield - xRef) / lambdaSpe);
  const effectiveSpeBfoMgyeq = roundTo(telemetry.spe_event_dose_mgyeq * speAttenuation, 1);

  const missionGcrMsv = roundTo(gcrRateMsvDay * resolveMissionDay(profile), 2);
  const totalCareerMsv = roundTo(profile.prior_career_rad_msv + missionGcrMsv, 2);
  const remainingCareerBudgetMsv = roundTo(Math.max(0.0, LIMIT_RAD_CAREER_MSV - totalCareerMsv), 2);

  const dGy = effectiveSpeBfoMgyeq / 1000.0;
  const kDepletionPerH = Math.max(0.0, 0.018 * (dGy - 0.25));

  const predictedAlc = Math.round(
    profile.alc_baseline_cells_ul * Math.exp(-kDepletionPerH * telemetry.hours_since_spe)
  );
  const alcDropPct = roundTo(
    100.0 * (1.0 - predictedAlc / Math.max(1.0, profile.alc_baseline_cells_ul)),
    1
  );

  const requiresCbcLabs =
    effectiveSpeBfoMgyeq >= LIMIT_BFO_30D_MGYEQ ||
    (telemetry.time_to_emesis_hours !== null && telemetry.time_to_emesis_hours <= 4.0);

  let radStatus = 'nominal';
  if (
    effectiveSpeBfoMgyeq >= LIMIT_BFO_1YR_MGYEQ ||
    totalCareerMsv >= LIMIT_RAD_CAREER_MSV ||
    (telemetry.time_to_emesis_hours !== null && telemetry.time_to_emesis_hours < 2.0)
  ) {
    radStatus = 'critical';
  } else if (
    effectiveSpeBfoMgyeq >= LIMIT_BFO_30D_MGYEQ ||
    totalCareerMsv >= 0.8 * LIMIT_RAD_CAREER_MSV ||
    (telemetry.time_to_emesis_hours !== null && telemetry.time_to_emesis_hours <= 4.0)
  ) {
    radStatus = 'caution';
  }

  return {
    shielding_areal_density_g_cm2: xShield,
    storm_shelter_available: stormShelterAvailable,
    shielding_posture_effective: effectivePosture,
    gcr_dose_rate_msv_day: gcrRateMsvDay,
    effective_spe_bfo_mgyeq: effectiveSpeBfoMgyeq,
    total_career_dose_msv: totalCareerMsv,
    remaining_career_budget_msv: remainingCareerBudgetMsv,
    predicted_alc_cells_ul: predictedAlc,
    alc_drop_pct: alcDropPct,
    requires_serial_cbc_labs: requiresCbcLabs,
    rad_status: radStatus,
  };
}

function hasMed(activeMeds, tokens) {
  const low = (activeMeds || []).join(' | ').toLowerCase();
  return tokens.some((tok) => low.includes(tok));
}

export function computeBoneAndRenal(env, profile, telemetry) {
  const gRatio = env.g_ratio;
  const alphaResPerMonth = 1.4;
  const etaAred = 0.65;
  const etaBis = 0.3;

  const hasAlendronate =
    Boolean(telemetry.alendronate_active) || hasMed(profile.active_meds, ['alendronat']);
  const hasCitrate =
    Boolean(telemetry.potassium_citrate_active) || hasMed(profile.active_meds, ['citrat']);

  const protectionFactor = Math.min(
    0.95,
    etaAred * telemetry.exercise_adherence_ratio + (hasAlendronate ? etaBis : 0.0)
  );
  const monthlyBmdLossPct = roundTo(
    alphaResPerMonth * (1.0 - gRatio) * (1.0 - protectionFactor),
    3
  );
  const monthsInSpace = Math.max(0.0, resolveMissionDay(profile) / 30.0);
  const cumulativeBmdLossPct = roundTo(
    -35.0 * (1.0 - Math.exp(-(monthlyBmdLossPct * monthsInSpace) / 35.0)),
    2
  );
  const projectedBmdTscore = roundTo(profile.bmd_tscore_baseline + cumulativeBmdLossPct / 10.0, 2);

  const citrateModifier = hasCitrate ? 0.7 : 1.0;
  const waiverModifier = profile.amb_waiver_renal ? 1.25 : 1.0;
  const supersaturationIndex = roundTo(
    ((0.4 + monthlyBmdLossPct) / Math.max(0.5, telemetry.urine_output_liters)) *
      citrateModifier *
      waiverModifier,
    2
  );

  let boneRenalStatus = 'nominal';
  if (
    telemetry.flank_pain ||
    telemetry.ionized_calcium_mmol_l > 1.45 ||
    supersaturationIndex >= 1.35
  ) {
    boneRenalStatus = 'critical';
  } else if (
    monthlyBmdLossPct >= 0.75 ||
    projectedBmdTscore <= -1.0 ||
    supersaturationIndex >= 0.9 ||
    telemetry.urine_specific_gravity >= 1.022 ||
    telemetry.ionized_calcium_mmol_l > 1.32
  ) {
    boneRenalStatus = 'caution';
  }

  return {
    monthly_bmd_loss_pct: monthlyBmdLossPct,
    cumulative_bmd_loss_pct: cumulativeBmdLossPct,
    projected_bmd_tscore: projectedBmdTscore,
    renal_supersaturation_index: supersaturationIndex,
    alendronate_protected: hasAlendronate,
    citrate_protected: hasCitrate,
    bone_renal_status: boneRenalStatus,
  };
}

export function computeNeuroAndAnxiety(profile, telemetry, lang = 'es') {
  const isEn = lang === 'en';
  const mimicKeys = [];
  const organicMimics = [];

  if (telemetry.cabin_ppco2_mmhg > LIMIT_PPCO2_MMHG) {
    mimicKeys.push('hypercapnia');
    organicMimics.push(
      isEn
        ? `Hypercapnia (ppCO2 = ${telemetry.cabin_ppco2_mmhg} mmHg > 3.0 mmHg)`
        : `Hipercapnia (ppCO2 = ${telemetry.cabin_ppco2_mmhg} mmHg > 3.0 mmHg)`
    );
  }
  const pio2Mmhg = Math.max(
    0.0,
    (telemetry.cabin_pressure_psia * 51.7149 - 47.0) * (telemetry.cabin_o2_percent / 100.0)
  );
  if (telemetry.spo2_percent < 94.0 || pio2Mmhg < 100.0) {
    mimicKeys.push('hypoxia');
    organicMimics.push(
      isEn
        ? `Hypoxia / hypobaric atmosphere (SpO2 = ${telemetry.spo2_percent}%, PIO2 = ${roundTo(pio2Mmhg, 1)} mmHg)`
        : `Hipoxia / atmósfera hipobárica (SpO2 = ${telemetry.spo2_percent}%, PIO2 = ${roundTo(pio2Mmhg, 1)} mmHg)`
    );
  }
  if (telemetry.glucose_mg_dl < 70.0) {
    mimicKeys.push('hypoglycemia');
    organicMimics.push(
      isEn
        ? `Hypoglycemia (${telemetry.glucose_mg_dl} mg/dL < 70 mg/dL)`
        : `Hipoglucemia (${telemetry.glucose_mg_dl} mg/dL < 70 mg/dL)`
    );
  }

  const hrvDropPct = roundTo(
    (100.0 * (profile.hrv_baseline_ms - telemetry.hrv_rmssd_ms)) /
      Math.max(1.0, profile.hrv_baseline_ms),
    1
  );
  const autonomicStrain =
    hrvDropPct >= 20.0 ||
    telemetry.heart_rate_bpm - profile.hr_baseline_bpm >= 12.0 ||
    telemetry.sleep_onset_latency_min > 30.0;
  const psychometricPositive = telemetry.gad2_score >= 3 || telemetry.anxiety_vas >= 6;
  const anxietyScreenPositive = mimicKeys.length === 0 && psychometricPositive && autonomicStrain;

  let pvtStatus = 'nominal';
  if (telemetry.pvt_mean_rt_ms >= PVT_LAPSE_THRESHOLD_MS || telemetry.pvt_lapses >= 2) {
    pvtStatus = 'critical';
  } else if (
    telemetry.pvt_mean_rt_ms >= 280.0 ||
    telemetry.pvt_lapses === 1 ||
    telemetry.sleep_hours < 6.0 ||
    telemetry.sleep_efficiency_pct < 85.0
  ) {
    pvtStatus = 'caution';
  }

  const recommend01hzBreathing =
    (anxietyScreenPositive ||
      (telemetry.is_pre_sleep_window &&
        (psychometricPositive || telemetry.sleep_onset_latency_min > 30.0))) &&
    mimicKeys.length === 0;

  let noiseStatus = 'nominal';
  if (telemetry.cabin_noise_dba >= LIMIT_NOISE_CRITICAL_DBA) {
    noiseStatus = 'critical';
  } else if (telemetry.cabin_noise_dba > LIMIT_NOISE_CAUTION_DBA) {
    noiseStatus = 'caution';
  }

  let neuroStatus = pvtStatus;
  if (anxietyScreenPositive && neuroStatus === 'nominal') {
    neuroStatus = 'caution';
  }
  if ((telemetry.audiometry_shift_4khz_db >= 15.0 || noiseStatus === 'caution') && neuroStatus === 'nominal') {
    neuroStatus = 'caution';
  }
  if (noiseStatus === 'critical') {
    neuroStatus = 'critical';
  }

  return {
    pvt_status: pvtStatus,
    hrv_drop_pct: hrvDropPct,
    organic_mimic_keys: mimicKeys,
    organic_mimics_detected: organicMimics,
    anxiety_screen_positive: anxietyScreenPositive,
    recommend_01hz_breathing: recommend01hzBreathing,
    avoid_blue_light_and_caffeine: recommend01hzBreathing || Boolean(telemetry.is_pre_sleep_window),
    resonance_frequency_hz: 0.1,
    noise_status: noiseStatus,
    neuro_status: neuroStatus,
  };
}

function worstStatus(...statuses) {
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('caution')) return 'caution';
  return 'nominal';
}

export function evaluateFullMissionState(rawProfile, rawTelemetry, lang = 'es') {
  const profile = normalizeBaselineProfile(rawProfile);
  const telemetry = normalizeTelemetryInput(rawTelemetry);
  const isEn = lang === 'en';
  const env = getEnvironment(telemetry.environment_id);
  const envId = env.id;

  const m1 = computeHydrostaticsAndFluids(env, profile, telemetry);
  const m2 = computeCabinCo2AndAlveolar(env, telemetry);
  const m3 = computeRadiationAndLymphocytes(env, profile, telemetry);
  const m4 = computeBoneAndRenal(env, profile, telemetry);
  const m5 = computeNeuroAndAnxiety(profile, telemetry, lang);

  const bpCrisis = telemetry.systolic_bp >= 180.0 || telemetry.diastolic_bp >= 120.0;
  const bpHypotension = telemetry.systolic_bp < 90.0;
  const bpCritical = bpCrisis || bpHypotension;
  const bpElevated =
    !bpCritical && (telemetry.systolic_bp >= 150.0 || telemetry.diastolic_bp >= 95.0);
  const hrCritical = telemetry.heart_rate_bpm < 40.0 || telemetry.heart_rate_bpm > 130.0;
  const hrModerate =
    !hrCritical && (telemetry.heart_rate_bpm < 45.0 || telemetry.heart_rate_bpm > 110.0);
  const hrAbnormal = hrCritical || hrModerate;

  const zones = {
    head_neuro_ocular: worstStatus(m1.sans_risk, m5.neuro_status),
    thorax_cardio_resp: worstStatus(
      m2.co2_status,
      telemetry.spo2_percent < 90 || telemetry.ecg_arrhythmia_detected || bpCritical || hrCritical
        ? 'critical'
        : telemetry.spo2_percent < 94 || bpElevated || hrAbnormal || m2.flammability_alert || m2.cabin_hypoxia
          ? 'caution'
          : 'nominal'
    ),
    musculoskeletal_renal: telemetry.pocus_dvt_suspicion ? 'critical' : m4.bone_renal_status,
    systemic_radiation_immune: worstStatus(
      m3.rad_status,
      telemetry.glucose_mg_dl < 70
        ? 'critical'
        : telemetry.glucose_mg_dl > 125 || telemetry.skin_rash_or_viral_symptoms
          ? 'caution'
          : 'nominal'
    ),
  };

  const priorities = [];

  // 1. Amenazas ambientales / respiratorias / hemodinámicas agudas
  if (m2.co2_status !== 'nominal') {
    const isCo2Predictive = telemetry.cabin_ppco2_mmhg <= LIMIT_PPCO2_MMHG;
    priorities.push({
      severity: m2.co2_status,
      title: isEn
        ? isCo2Predictive
          ? `Rising Cabin ppCO2 / CDRA Fault (${telemetry.cabin_ppco2_mmhg} → ${m2.projected_ppco2_4h_mmhg} mmHg in 4h)`
          : `Elevated Cabin ppCO2 (${telemetry.cabin_ppco2_mmhg} mmHg)`
        : isCo2Predictive
          ? `ppCO2 en Ascenso por Fallo CDRA (${telemetry.cabin_ppco2_mmhg} → ${m2.projected_ppco2_4h_mmhg} mmHg en 4h)`
          : `ppCO2 Ambiental Elevada (${telemetry.cabin_ppco2_mmhg} mmHg)`,
      detail: isEn
        ? `Exceeds NASA-STD-3001 (<= 3.0 mmHg). 4h projection: ${m2.projected_ppco2_4h_mmhg} mmHg. Causes headache, cerebral vasodilation (worsens SANS) and slows PVT.`
        : `Supera el límite NASA-STD-3001 (<= 3.0 mmHg). Proyección a 4h: ${m2.projected_ppco2_4h_mmhg} mmHg. Causa cefalea, vasodilatación cerebral (agrava SANS) y enlentece el PVT.`,
      action: isEn
        ? 'Activate local forced ventilation, verify CDRA/amine scrubber and pause strenuous exercise.'
        : 'Activar ventilación forzada local, verificar scrubber CDRA/aminas y pausar ejercicio intenso.',
      protocol_id: 'eva_dcs_hypoxia',
    });
  }

  if (m2.flammability_alert || m2.cabin_hypoxia) {
    priorities.push({
      severity:
        m2.estimated_inspired_po2_mmhg < 80.0 || telemetry.cabin_o2_percent >= 30.0
          ? 'critical'
          : 'caution',
      title: isEn
        ? `Cabin Atmosphere Alert (P: ${telemetry.cabin_pressure_psia} psia, O2: ${telemetry.cabin_o2_percent}%)`
        : `Alerta Atmosférica de Cabina (P: ${telemetry.cabin_pressure_psia} psia, O2: ${telemetry.cabin_o2_percent}%)`,
      detail: isEn
        ? (m2.flammability_alert
            ? 'O2 concentration >= 23.5% exceeds NASA-STD-3001 [V2 11040] flammability safety limit. '
            : '') +
          (m2.cabin_hypoxia
            ? `Hypobaric/hypoxic inspired PIO2 (${m2.estimated_inspired_po2_mmhg} mmHg, PAO2 ${m2.estimated_alveolar_po2_mmhg} mmHg).`
            : `Inspired PIO2: ${m2.estimated_inspired_po2_mmhg} mmHg.`)
        : (m2.flammability_alert
            ? 'O2 >= 23.5% excede el límite de inflamabilidad NASA-STD-3001 [V2 11040]. '
            : '') +
          (m2.cabin_hypoxia
            ? `PIO2 inspirada hipóxica (${m2.estimated_inspired_po2_mmhg} mmHg, PAO2 ${m2.estimated_alveolar_po2_mmhg} mmHg).`
            : `PIO2 inspirada: ${m2.estimated_inspired_po2_mmhg} mmHg.`),
      action: isEn
        ? 'Isolate ignition sources/free O2 leaks, verify ECLSS N2/O2 balance and apply closed-mask O2 if hypoxic.'
        : 'Aislar fuentes de ignición/fugas de O2, verificar mezcla N2/O2 ECLSS y usar mascarilla O2 si hay hipoxia.',
      protocol_id: 'eva_dcs_hypoxia',
    });
  }

  if (telemetry.spo2_percent < 94.0) {
    const hypSev = telemetry.spo2_percent < 90.0 ? 'critical' : 'caution';
    priorities.push({
      severity: hypSev,
      title: isEn
        ? `Hypoxia / Desaturation (${telemetry.spo2_percent}% SpO2)`
        : `Hipoxia / Desaturación (${telemetry.spo2_percent}% SpO2)`,
      detail: isEn
        ? `SpO2 below clinical threshold (< 94%). Estimated alveolar PAO2: ${m2.estimated_alveolar_po2_mmhg} mmHg.`
        : `SpO2 por debajo del umbral clínico (< 94%). PAO2 alveolar estimada: ${m2.estimated_alveolar_po2_mmhg} mmHg.`,
      action: isEn
        ? 'Administer 100% supplemental O2, check cabin pressure/ppO2 and OGS supply; rule out depressurization or ABCDE emergency.'
        : 'Administrar O2 suplementario al 100%, verificar presión/ppO2 de cabina y suministro OGS; descartar despresurización o evento agudo ABCDE.',
      protocol_id: telemetry.spo2_percent < 90.0 ? 'abcde_0g_fast' : 'eva_dcs_hypoxia',
    });
  }

  if (telemetry.ecg_arrhythmia_detected || bpCritical || bpElevated || hrAbnormal) {
    const sbpInt = Math.trunc(telemetry.systolic_bp);
    const dbpInt = Math.trunc(telemetry.diastolic_bp);
    const hrInt = Math.trunc(telemetry.heart_rate_bpm);
    const isAcuteInstability =
      telemetry.ecg_arrhythmia_detected || bpHypotension || hrCritical;
    const hasNeuroOrHypoxia =
      m5.pvt_status !== 'nominal' || telemetry.spo2_percent < 94.0;

    if (isAcuteInstability) {
      priorities.push({
        severity: 'critical',
        title: isEn
          ? `Cardiovascular Alert (BP ${sbpInt}/${dbpInt}, HR ${hrInt} bpm)`
          : `Alerta Cardiovascular (PA ${sbpInt}/${dbpInt}, FC ${hrInt} lpm)`,
        detail: isEn
          ? (telemetry.ecg_arrhythmia_detected ? 'ECG arrhythmia detected. ' : '') +
            'Acute hemodynamic instability / hypotension or severe brady-tachycardia risk (SBP < 90, HR < 40 or > 130 bpm).'
          : (telemetry.ecg_arrhythmia_detected ? 'Arritmia ECG detectada. ' : '') +
            'Inestabilidad hemodinámica aguda / hipotensión o bradi-taquicardia severa (PAS < 90, FC < 40 o > 130 lpm).',
        action: isEn
          ? 'Obtain 12-lead ECG, suspend LBNP/exercise, keep airway & AED ready under ABCDE 0g if unstable.'
          : 'Tomar ECG de 12 derivaciones, suspender LBNP/ejercicio y activar protocolo ABCDE 0g / Carril 2 si hay inestabilidad.',
        protocol_id: 'abcde_0g_fast',
      });
    } else if (bpCrisis) {
      priorities.push({
        severity: 'critical',
        title: isEn
          ? `Cardiovascular Alert: Hypertensive Crisis (BP ${sbpInt}/${dbpInt}, HR ${hrInt} bpm)`
          : `Alerta Cardiovascular: Crisis Hipertensiva (PA ${sbpInt}/${dbpInt}, FC ${hrInt} lpm)`,
        detail: isEn
          ? 'BP >= 180/120 mmHg. Screen urgently for target-organ damage (focal neuro deficit, chest pain, dyspnea or acute SANS) before lowering BP.'
          : 'PA >= 180/120 mmHg. Descartar daño a órgano blanco (déficit neurológico, dolor torácico, disnea o SANS agudo) antes de descender la presión.',
        action: isEn
          ? 'Repeat BP in 5 min, obtain 12-lead ECG, pause ARED/NaCl load, screen focal neuro deficit (FAST only if symptomatic) and initiate Flight Surgeon Lane 2 consult; avoid abrupt BP drop.'
          : 'Repetir PA en 5 min, tomar ECG de 12 derivaciones, pausar ARED/carga de NaCl, buscar déficit focal (FAST solo si hay síntomas) y consultar Carril 2 con Flight Surgeon; evitar descenso brusco.',
        protocol_id: hasNeuroOrHypoxia ? 'abcde_0g_fast' : null,
      });
    } else {
      priorities.push({
        severity: 'caution',
        title: isEn
          ? `Cardiovascular Alert: Elevated BP / HR (${sbpInt}/${dbpInt} mmHg, HR ${hrInt} bpm)`
          : `Alerta Cardiovascular: Elevación Tensional / FC (${sbpInt}/${dbpInt} mmHg, FC ${hrInt} lpm)`,
        detail: isEn
          ? 'Parameter outside nominal range (SBP >= 150 or DBP >= 95 mmHg, or HR 40–44 / 111–130 bpm) without crisis (< 180/120) or shock. Isolated asymptomatic hypertension does NOT activate Stroke FAST or AED.'
          : 'Parámetro fuera de límites nominales (PAS >= 150 o PAD >= 95 mmHg, o FC 40–44 / 111–130 lpm) sin criterio de crisis (< 180/120) ni choque. Una elevación aislada asintomática NO activa protocolo FAST ni DEA.',
        action: isEn
          ? 'Rest quietly 5 min and repeat BP on both arms (rule out cuff/ARED artifact); screen for headache, chest pain, dyspnea or focal deficit (ECG/FAST only if symptomatic); pause ARED/acute NaCl loading and monitor.'
          : 'Reposar 5 min y repetir toma en ambos brazos (descartar artefacto de manguito/ARED); buscar cefalea, dolor torácico, disnea o déficit focal (ECG/FAST solo si hay síntomas); pausar ARED/carga aguda de NaCl y vigilar.',
        protocol_id: null,
      });
    }
  }

  if (m3.rad_status !== 'nominal' || m3.requires_serial_cbc_labs) {
    const hasShelter = isHardwareAvailable(envId, 'Storm Shelter');
    let actionParts;
    if (isEn) {
      actionParts = [
        hasShelter
          ? 'Relocate to Storm Shelter (45 g/cm²) and cancel EVA (ALARA principle).'
          : 'Abort EVA immediately, use rover/terrain mass shielding (no 45 g/cm² Storm Shelter on this vehicle) and return to base habitat.',
      ];
      if (m3.requires_serial_cbc_labs) {
        actionParts.push(
          `Draw baseline (4-6h) and 24/48/72h serial CBC (projected ALC: ${m3.predicted_alc_cells_ul} cells/µL).`
        );
      }
    } else {
      actionParts = [
        hasShelter
          ? 'Trasladarse a Storm Shelter (45 g/cm²) y cancelar EVA (principio ALARA).'
          : 'Abortar EVA de inmediato, usar blindaje de masa del vehículo/terreno (sin Storm Shelter de 45 g/cm² en este vehículo) y retornar al módulo base.',
      ];
      if (m3.requires_serial_cbc_labs) {
        actionParts.push(
          `Tomar BH basal (4–6 h) y seriada 24/48/72 h (ALC proyectado: ${m3.predicted_alc_cells_ul} cél/µL).`
        );
      }
    }

    priorities.push({
      severity: m3.rad_status === 'nominal' && m3.requires_serial_cbc_labs ? 'caution' : m3.rad_status,
      title: isEn
        ? `Radiation / SPE Alert (${m3.effective_spe_bfo_mgyeq} mGy-Eq BFO)`
        : `Alerta Dosimétrica / SPE (${m3.effective_spe_bfo_mgyeq} mGy-Eq a BFO)`,
      detail: isEn
        ? `Remaining career effective budget: ${m3.remaining_career_budget_msv} mSv (of 600 mSv). Monitor prodromal emesis & viral reactivation.`
        : `Presupuesto efectivo restante de carrera: ${m3.remaining_career_budget_msv} mSv (de 600 mSv). Vigilar emesis prodrómica y reactivación viral.`,
      action: actionParts.join(' '),
      protocol_id: hasShelter || m3.requires_serial_cbc_labs ? 'spe_storm_shelter' : null,
    });
  }

  // 2. Alteraciones glucémicas o inmuno-virales directas
  if (telemetry.glucose_mg_dl < 70.0 || telemetry.glucose_mg_dl > 125.0) {
    const isHypo = telemetry.glucose_mg_dl < 70.0;
    priorities.push({
      severity: isHypo ? 'critical' : 'caution',
      title: isEn
        ? `${isHypo ? 'Severe Hypoglycemia' : 'Elevated Blood Glucose'} (${telemetry.glucose_mg_dl} mg/dL)`
        : `${isHypo ? 'Hipoglucemia Aguda' : 'Glucemia Elevada'} (${telemetry.glucose_mg_dl} mg/dL)`,
      detail:
        isEn && isHypo
          ? 'Can mimic acute stroke/neuro deficit. Do not give oral glucose if altered consciousness or dysphagia in 0g.'
          : isHypo
            ? 'Puede imitar déficit neurológico/ICTUS. En 0g prohibida la vía oral si hay alteración de conciencia o disfagia.'
            : isEn
              ? 'Metabolic dysregulation above fasting threshold (> 125 mg/dL); recheck via PCBA i-STAT.'
              : 'Glucemia por encima de rango basal (> 125 mg/dL); confirmar con cartucho i-STAT en ayuno.',
      action:
        isEn && isHypo
          ? 'Give IV Dextrose (D50W/D10W) or Glucagon 1 mg IM if altered airway; oral 15 g gel ONLY if alert with intact swallow.'
          : isHypo
            ? 'Administrar Dextrosa IV (D50W/D10W) o Glucagón 1 mg IM si vía aérea comprometida; gel bucal 15 g SOLO si alerta y deglute.'
            : isEn
              ? 'Repeat capillary i-STAT CHEM8+ and evaluate caloric/steroid/stress balance.'
              : 'Repetir glucemia i-STAT CHEM8+ y evaluar balance calórico/estrés metabólico.',
      protocol_id: isHardwareAvailable(envId, 'PCBA (Abbott i-STAT)') ? 'pcba_istat' : 'abcde_0g_fast',
    });
  }

  if (telemetry.skin_rash_or_viral_symptoms && m3.rad_status === 'nominal' && !m3.requires_serial_cbc_labs) {
    priorities.push({
      severity: 'caution',
      title: isEn ? 'Latent Viral Reactivation / Cutaneous Rash' : 'Reactivación Viral / Exantema Cutáneo',
      detail: isEn
        ? 'Microgravity immune dysregulation marker (HSV/VZV/atopic flare) without elevated SPE dose.'
        : 'Signo compatible con desregulación inmune en microgravedad o reactivación viral sin evento SPE agudo.',
      action: isEn
        ? 'Document lesions, evaluate topical/antiviral therapy and reinforce crew hygiene isolation.'
        : 'Documentar distribución dermatológica, valorar antiviral/tópico del botiquín y medidas de aislamiento de contacto.',
      protocol_id: null,
    });
  }

  // 3. Neuroconductual / Ansiedad vs Imitadores Orgánicos
  if (m5.organic_mimic_keys.length > 0 && (telemetry.anxiety_vas >= 6 || telemetry.gad2_score >= 3)) {
    const onlyEnvMimic =
      m5.organic_mimic_keys.every((k) => k === 'hypercapnia' || k === 'hypoxia') &&
      telemetry.spo2_percent >= 94.0 &&
      telemetry.glucose_mg_dl >= 70.0;
    priorities.push({
      severity: 'critical',
      title: isEn
        ? 'Organic Rule-Out: Physical Cause Driving Adrenergic Symptoms'
        : 'Descarte Orgánico: Síntomas Adrenérgicos por Causa Física',
      detail:
        (isEn
          ? 'Before treating as primary anxiety, correct: '
          : 'Antes de tratar como ansiedad primaria, corrige: ') +
        m5.organic_mimics_detected.join('; '),
      action:
        isEn && onlyEnvMimic
          ? 'Stabilize cabin ventilation/CDRA/O2 pressure first (sensor-confirmed; no i-STAT cartridge needed).'
          : onlyEnvMimic
            ? 'Corregir ventilación/CDRA/presión O2 de cabina (causa medida por sensor ambiental; no requiere gastar cartucho i-STAT).'
            : isEn
              ? 'Stabilize atmosphere, oxygenation and capillary glucose immediately.'
              : 'Estabilizar atmósfera/oxigenación/glucosa capilar de inmediato.',
      protocol_id: onlyEnvMimic
        ? 'eva_dcs_hypoxia'
        : isHardwareAvailable(envId, 'PCBA (Abbott i-STAT)')
          ? 'pcba_istat'
          : null,
    });
  } else if (m5.recommend_01hz_breathing) {
    priorities.push({
      severity: 'caution',
      title: isEn
        ? 'Positive Anxiety / Pre-Sleep Insomnia Screen'
        : 'Tamizaje Positivo de Ansiedad / Insomnio Pre-Sueño',
      detail: isEn
        ? `GAD-2: ${telemetry.gad2_score}/6, VAS: ${telemetry.anxiety_vas}/10, HRV drop: ${m5.hrv_drop_pct}%. Organic mimics ruled out.`
        : `GAD-2: ${telemetry.gad2_score}/6, VAS: ${telemetry.anxiety_vas}/10, caída HRV: ${m5.hrv_drop_pct}%. Descarte orgánico limpio.`,
      action: isEn
        ? 'BLOCK blue light and caffeine. Start 5–10 min guided 0.1 Hz resonance breathing (4s inhale / 6s exhale) in dim amber light.'
        : 'BLOQUEAR luz azul y cafeína. Iniciar sesión de 5–10 min de Respiración Guiada a 0.1 Hz (4s inhalar / 6s exhalar) con luz tenue ámbar/roja.',
      protocol_id: 'breathing_01hz',
    });
  }

  if (m5.pvt_status === 'critical' || (m5.pvt_status !== 'nominal' && !m5.recommend_01hz_breathing)) {
    const pvtAction = isEn
      ? m5.avoid_blue_light_and_caffeine
        ? 'Protect immediate sleep block (pre-sleep window: avoid blue light & caffeine). No-Go for EVA/critical ops.'
        : '460–480 nm blue light + strategic caffeine. If >= 355 ms persists: No-Go for EVA/critical ops and protect sleep block.'
      : m5.avoid_blue_light_and_caffeine
        ? 'Proteger bloque de sueño inmediato (ventana pre-sueño: evitar luz azul y cafeína). No-Go para EVA/maniobras críticas.'
        : 'Exposición a luz azul melanópica (460–480 nm) + cafeína estratégica. Si persiste >= 355 ms: No-Go para EVA/maniobras críticas y proteger bloque de sueño.';

    priorities.push({
      severity: m5.pvt_status,
      title: isEn
        ? `PVT-B Psychomotor Fatigue (${telemetry.pvt_mean_rt_ms} ms, ${telemetry.pvt_lapses} lapses)`
        : `Fatiga Psicomotora en PVT-B (${telemetry.pvt_mean_rt_ms} ms, ${telemetry.pvt_lapses} lapsus)`,
      detail: isEn
        ? 'Reduced reaction speed during operational shift.'
        : 'Velocidad de reacción disminuida en turno operativo.',
      action: pvtAction,
      protocol_id: telemetry.spo2_percent < 94.0 || telemetry.systolic_bp >= 150 ? 'abcde_0g_fast' : null,
    });
  }

  if (telemetry.audiometry_shift_4khz_db >= 15.0 || m5.noise_status !== 'nominal') {
    priorities.push({
      severity: m5.noise_status === 'critical' ? 'critical' : 'caution',
      title: isEn
        ? `Acoustic Risk / Hearing Shift (Noise ${telemetry.cabin_noise_dba} dBA, 4 kHz +${telemetry.audiometry_shift_4khz_db} dB)`
        : `Riesgo Acústico / Shift Auditivo (Ruido ${telemetry.cabin_noise_dba} dBA, 4 kHz +${telemetry.audiometry_shift_4khz_db} dB)`,
      detail: isEn
        ? 'Exceeds NASA-STD-3001 [V2 6078/6080] acoustic guidelines or shows >= 15 dB relative 4 kHz screening shift.'
        : 'Supera referencia acústica NASA-STD-3001 [V2 6078/6080] o muestra desplazamiento >= 15 dB en tamizaje relativo a 4 kHz.',
      action: isEn
        ? 'Enforce hearing protection, allow 14h+ acoustic rest, and inspect noisy fans/pumps.'
        : 'Indicar protección auditiva doble, reposo acústico > 14h para diferenciar TTS vs PTS e inspeccionar ventiladores.',
      protocol_id: null,
    });
  }

  if (Math.abs(profile.baseline_refraction_diopters) > 5.5) {
    const signedRef =
      (profile.baseline_refraction_diopters >= 0 ? '+' : '') +
      profile.baseline_refraction_diopters.toFixed(2);
    priorities.push({
      severity: 'caution',
      title: isEn ? 'Refraction Outside OCHMO-STD-100.1A Limit' : 'Refracción Fuera de Rango OCHMO-STD-100.1A',
      detail: isEn
        ? `Recorded baseline refraction (${signedRef} D) exceeds ±5.50 D without documented waiver.`
        : `Refracción basal registrada (${signedRef} D) excede ±5.50 D.`,
      action: isEn
        ? 'Verify spare crew eyewear and Aeromedical Board waiver in OCHMO-STD-100.1A.'
        : 'Verificar lentes de repuesto en órbita y registro de waiver médico OCHMO-STD-100.1A.',
      protocol_id: null,
    });
  }

  // 4. SANS y Fluid Shift
  if (m1.sans_risk !== 'nominal') {
    let cmText;
    let proto;
    if (isEn) {
      const imagingDevice = isHardwareAvailable(envId, 'OCT')
        ? 'OCT + POCUS ONSD'
        : 'POCUS ONSD + Amsler Grid (no OCT on this vehicle)';
      if (isHardwareAvailable(envId, 'LBNP') && m1.lbnp_safe) {
        cmText = `Perform ${imagingDevice} and schedule LBNP session with continuous ECG/BP monitoring.`;
        proto = 'lbnp_safety';
      } else if (isHardwareAvailable(envId, 'LBNP') && !m1.lbnp_safe) {
        cmText = `Perform ${imagingDevice}. LBNP LOCKED by safety gate (rule out hypovolemia/DVT/arrhythmia/hypoglycemia first); use Thigh Cuffs (30–50 mmHg), sodium < 3,000 mg/day and B-complex.`;
        proto = telemetry.pocus_dvt_suspicion ? 'pocus_dvt' : 'thigh_cuff_sans';
      } else {
        cmText = `Perform ${imagingDevice} and apply Thigh Cuffs (30–50 mmHg, sequesters 500–1000 mL) + sodium < 3,000 mg/day; return to base/habitat if progressing.`;
        proto = 'thigh_cuff_sans';
      }
    } else {
      const imagingDevice = isHardwareAvailable(envId, 'OCT')
        ? 'OCT + POCUS ONSD'
        : 'POCUS ONSD + Rejilla de Amsler (sin OCT en este vehículo)';
      if (isHardwareAvailable(envId, 'LBNP') && m1.lbnp_safe) {
        cmText = `Realizar ${imagingDevice} y programar sesión de LBNP con monitoreo ECG/Bauma continuo.`;
        proto = 'lbnp_safety';
      } else if (isHardwareAvailable(envId, 'LBNP') && !m1.lbnp_safe) {
        cmText = `Realizar ${imagingDevice}. LBNP BLOQUEADO por candado de seguridad (descartar hipovolemia/TVP/arritmia/hipoglucemia primero); usar Thigh Cuffs (30-50 mmHg), restringir sodio < 3,000 mg/día y mantener Complejo B.`;
        proto = telemetry.pocus_dvt_suspicion ? 'pocus_dvt' : 'thigh_cuff_sans';
      } else {
        cmText = `Realizar ${imagingDevice} y usar Thigh Cuffs (30-50 mmHg, secuestra 500-1000 mL en piernas) + sodio < 3,000 mg/día; retornar a base/módulo si progresa.`;
        proto = 'thigh_cuff_sans';
      }
    }

    priorities.push({
      severity: m1.sans_risk,
      title: isEn
        ? `SANS Neuro-Ocular Surveillance (ΔONSD: +${m1.onsd_delta_mm} mm, ΔTRT250: ${m1.oct_trt250_delta_um} µm)`
        : `Vigilancia Neuro-Ocular SANS (ΔONSD: +${m1.onsd_delta_mm} mm, ΔTRT250: ${m1.oct_trt250_delta_um} µm)`,
      detail: isEn
        ? `Lost standing hydrostatic gradient: ${m1.cephalad_pressure_shift_mmhg} mmHg.`
        : `Gradiente ortostático perdido respecto a 1g: ${m1.cephalad_pressure_shift_mmhg} mmHg.`,
      action: cmText,
      protocol_id: proto,
    });
  } else if (telemetry.pocus_dvt_suspicion) {
    priorities.push({
      severity: 'critical',
      title: isEn
        ? 'Suspected Deep Vein Thrombosis (DVT) — LBNP LOCKED'
        : 'Sospecha de Trombosis Venosa Profunda (TVP) — LBNP BLOQUEADO',
      detail: isEn
        ? 'Positive venous POCUS suspicion with nominal SANS metrics.'
        : 'Signo positivo o sospecha POCUS venosa yugular/profunda con SANS aún nominal.',
      action: isEn
        ? 'LBNP strictly contraindicated. Perform immediate compressive POCUS DVT scan and consult Flight Surgeon.'
        : 'LBNP estrictamente contraindicado. Realizar POCUS compresivo TVP inmediato, valorar anticoagulación y consultar Flight Surgeon.',
      protocol_id: 'pocus_dvt',
    });
  }

  // 5. Preparación Ortostática Pre-Descenso
  if (telemetry.is_planetary_descent_soon) {
    const severeSans =
      m1.sans_risk === 'critical' ||
      telemetry.onsd_measured_mm >= 5.8 ||
      telemetry.amsler_distortions > 0;
    const highBpContra = telemetry.systolic_bp >= 150.0;
    const fluidContra = severeSans || highBpContra;
    const hasOig = isHardwareAvailable(envId, 'OIG / Kentavr');
    const suitNoteEn = hasOig ? 'don OIG / Kentavr suit' : 'use crew compression garment / return via base lander';
    const suitNoteEs = hasOig ? 'colocar prenda OIG / Kentavr' : 'usar prenda compresiva disponible / traslado a módulo de descenso';

    let contraDetailEn;
    let contraDetailEs;
    if (severeSans && highBpContra) {
      contraDetailEn = 'Active severe SANS and SBP ≥ 150 mmHg: relative contraindication for aggressive acute NaCl loading.';
      contraDetailEs = 'SANS severo activo y PAS ≥ 150 mmHg: contraindicación relativa para sobrecarga aguda de NaCl.';
    } else if (severeSans) {
      contraDetailEn = 'Active severe SANS: relative contraindication for aggressive acute NaCl loading (may worsen neuro-ocular edema).';
      contraDetailEs = 'SANS severo activo: contraindicación relativa para sobrecarga aguda de NaCl (puede agravar edema neuro-ocular).';
    } else {
      contraDetailEn = `Elevated SBP (${telemetry.systolic_bp} mmHg ≥ 150 mmHg): relative contraindication for aggressive acute NaCl loading.`;
      contraDetailEs = `PAS elevada (${telemetry.systolic_bp} mmHg ≥ 150 mmHg): contraindicación relativa para sobrecarga aguda de NaCl.`;
    }

    priorities.push({
      severity: severeSans ? 'critical' : 'caution',
      title: isEn
        ? `Pre-Descent Preparation (Plasma Vol: ${m1.plasma_volume_change_pct}%)`
        : `Preparación Pre-Descenso (Volumen plasmático: ${m1.plasma_volume_change_pct}%)`,
      detail:
        isEn && fluidContra
          ? contraDetailEn
          : fluidContra
            ? contraDetailEs
            : isEn
              ? 'High risk of orthostatic intolerance and syncope on gravity re-entry.'
              : 'Riesgo alto de intolerancia ortostática y síncope al reentrar a campo gravitatorio.',
      action:
        isEn && fluidContra
          ? `DO NOT run aggressive NaCl bolus without Flight Surgeon clearance; control BP/ONSD under monitoring and ${suitNoteEn}.`
          : fluidContra
            ? `NO ejecutar carga agresiva de NaCl sin autorización del Flight Surgeon; vigilar PA/ONSD/PIO y ${suitNoteEs}.`
            : isEn
              ? `Execute Fluid Loading (1.0 L + 8-9 NaCl 1g tabs over 60-90 min) and ${suitNoteEn}.`
              : `Ejecutar Fluid Loading (1.0 L + 8-9 tabletas NaCl 1g en 60-90 min) y ${suitNoteEs}.`,
      protocol_id: 'fluid_loading_reentry',
    });
  }

  // 6. Hueso y Riñón
  if (m4.bone_renal_status !== 'nominal') {
    const exDev = isHardwareAvailable(envId, 'ARED')
      ? 'ARED + T2'
      : isEn
        ? 'Zero T2 / resistive bands (no ARED on this vehicle)'
        : 'Zero T2 / bandas resistivas (sin ARED en este vehículo)';

    const actionBr = telemetry.flank_pain
      ? isEn
        ? 'Protocol analgesia, tamsulosin, renal POCUS (rule out hydronephrosis) and PCBA i-STAT Cr/K+ before potassium citrate.'
        : 'Analgesia de protocolo, tamsulosina, POCUS renal (descartar hidronefrosis) e i-STAT Cr/K+ antes de valorar citrato.'
      : isEn
        ? `Increase fluids >= 2.5 L/day, review potassium citrate / alendronate 70 mg/wk and maintain load on ${exDev}.`
        : `Aumentar hidratación a >= 2.5 L/día, valorar citrato de potasio / alendronato 70 mg/sem y cumplir carga en ${exDev}.`;

    priorities.push({
      severity: m4.bone_renal_status,
      title: isEn
        ? `Bone–Renal Axis (BMD: ${m4.cumulative_bmd_loss_pct}%, Renal Sat: ${m4.renal_supersaturation_index})`
        : `Eje Hueso–Riñón (DMO: ${m4.cumulative_bmd_loss_pct}%, Sat. Renal: ${m4.renal_supersaturation_index})`,
      detail: isEn
        ? `Current rate: ${m4.monthly_bmd_loss_pct}%/mo. Urine output: ${telemetry.urine_output_liters} L/day.`
        : `Pérdida actual: ${m4.monthly_bmd_loss_pct}%/mes. Diuresis: ${telemetry.urine_output_liters} L/día.`,
      action: actionBr,
      protocol_id: 'renal_stone_pocus',
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      severity: 'nominal',
      title: isEn ? 'Nominal Physiological & Cabin State' : 'Estado Fisiológico y Ambiental Nominal',
      detail: isEn
        ? 'All parameters within NASA-STD-3001 thresholds and personal baseline.'
        : 'Todos los parámetros dentro de umbrales NASA-STD-3001 y línea base personal.',
      action: isEn
        ? 'Continue daily routine: hydration >= 2.5 L, scheduled exercise block and 60s check-in.'
        : 'Continuar rutina diaria: hidratación >= 2.5 L, sesión de ejercicio programada y check-in de 60 s.',
      protocol_id: null,
    });
  }

  const globalStatus = worstStatus(...Object.values(zones), ...priorities.map((p) => p.severity));

  return {
    environment: env,
    global_status: globalStatus,
    zones,
    models: {
      hydrostatics_and_fluids: m1,
      cabin_co2_and_alveolar: m2,
      radiation_and_lymphocytes: m3,
      bone_and_renal: m4,
      neuro_and_anxiety: m5,
    },
    priorities,
  };
}

export function stepTelemetryDt(rawTelemetry, dtMinutes = 5.0, rawProfile = null) {
  const telemetry = normalizeTelemetryInput(rawTelemetry);
  const profile = rawProfile ? normalizeBaselineProfile(rawProfile) : null;
  const dtClamped = Math.max(0.0, Math.min(1440.0, Number(dtMinutes) || 0.0));
  if (dtClamped === 0.0) {
    return telemetry;
  }

  const dtH = dtClamped / 60.0;
  const data = { ...telemetry };
  const env = getEnvironment(telemetry.environment_id);

  const [metabolicGen, removal] = cdraRatesMmhgH(env, telemetry);
  const dPpco2Dt = Math.max(-0.5, metabolicGen - removal);
  const nextPpco2 = telemetry.cabin_ppco2_mmhg + dPpco2Dt * dtH;
  data.cabin_ppco2_mmhg = roundTo(Math.max(0.6, Math.min(8.5, nextPpco2)), 2);

  const hrBase = profile ? profile.hr_baseline_bpm : 64.0;
  const onsdBase = profile ? profile.onsd_baseline_mm : 4.2;
  const co2Excess = Math.max(0.0, data.cabin_ppco2_mmhg - 3.0);
  const targetHr = hrBase + co2Excess * 5.5 + (telemetry.water_intake_liters < 2.0 ? 6.0 : 0.0);
  data.heart_rate_bpm = roundTo(
    telemetry.heart_rate_bpm + (targetHr - telemetry.heart_rate_bpm) * Math.min(1.0, 0.25 * dtH),
    1
  );

  let targetOnsd = onsdBase + co2Excess * 0.14;
  if (env.g_ratio < 0.16) {
    targetOnsd = Math.max(telemetry.onsd_measured_mm, targetOnsd);
  }
  data.onsd_measured_mm = roundTo(
    telemetry.onsd_measured_mm + (targetOnsd - telemetry.onsd_measured_mm) * Math.min(1.0, 0.2 * dtH),
    2
  );

  if (telemetry.spe_event_dose_mgyeq > 0.0) {
    data.hours_since_spe = roundTo(telemetry.hours_since_spe + dtH, 2);
  }

  return normalizeTelemetryInput(data);
}
