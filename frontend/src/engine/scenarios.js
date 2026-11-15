/**
 * Escenarios preconfigurados para el [Modo Simulador Demo].
 * Paridad 1:1 con DEMO_SCENARIOS en backend/main.py.
 */

import { DEFAULT_TELEMETRY_INPUT } from './physicsEngine.js';

function withDefaults(overrides = {}) {
  return { ...DEFAULT_TELEMETRY_INPUT, ...overrides };
}

export const DEMO_SCENARIOS = {
  nominal: {
    name: 'Día Nominal en Misión',
    name_en: 'Nominal Mission Day',
    description: 'Parámetros ambientales y signos vitales dentro de rangos NASA-STD-3001.',
    description_en: 'Cabin environment and crew vitals within NASA-STD-3001 limits.',
    telemetry: withDefaults(),
  },
  co2_scrubber_failure: {
    name: 'Fallo Parcial de Scrubber CO2 (CDRA)',
    name_en: 'Partial CO2 Scrubber Failure (CDRA)',
    description: 'Acumulación de ppCO2 (> 3.0 mmHg) sin convección en 0g -> cefalea, vasodilatación (SANS) y caída en PVT.',
    description_en: 'Cabin ppCO2 buildup (> 3.0 mmHg) without 0g convection -> headache, cerebral vasodilation (worsens SANS) and PVT slowing.',
    telemetry: withDefaults({
      cabin_ppco2_mmhg: 4.4,
      cdra_scrubber_efficiency: 0.2,
      pvt_mean_rt_ms: 345.0,
      pvt_lapses: 1,
      onsd_measured_mm: 4.7,
      anxiety_vas: 7,
      gad2_score: 3,
    }),
  },
  solar_storm_spe: {
    name: 'Tormenta Solar Aguda (SPE) en Tránsito',
    name_en: 'Acute Solar Particle Event (SPE) in Transit',
    description: 'Evento de protones solares en espacio profundo: supera umbral de 250 mGy-Eq a BFO y activa protocolo de BH/linfocitos.',
    description_en: 'Deep-space solar protons exceed 250 mGy-Eq BFO limit; triggers storm shelter & serial CBC lymphocyte protocol.',
    telemetry: withDefaults({
      environment_id: 'transit',
      shielding_posture: 'nominal',
      spe_event_dose_mgyeq: 380.0,
      hours_since_spe: 24.0,
      skin_rash_or_viral_symptoms: true,
    }),
  },
  pre_sleep_anxiety: {
    name: 'Insomnio por Ansiedad Pre-Sueño',
    name_en: 'Pre-Sleep Anxiety & Insomnia',
    description: 'Descarte orgánico limpio + GAD-2 positivo + caída de HRV en ventana nocturna -> activa respiración vagal a 0.1 Hz.',
    description_en: 'Organic mimics clean + positive GAD-2 + HRV drop in pre-sleep window -> triggers 0.1 Hz vagal breathing.',
    telemetry: withDefaults({
      is_pre_sleep_window: true,
      sleep_hours: 5.1,
      sleep_onset_latency_min: 48.0,
      pvt_mean_rt_ms: 362.0,
      pvt_lapses: 2,
      heart_rate_bpm: 82.0,
      hrv_rmssd_ms: 28.0,
      anxiety_vas: 8,
      gad2_score: 4,
    }),
  },
  mars_descent_bone_renal: {
    name: 'Descenso a Marte (0.38g) + Riesgo Renal',
    name_en: 'Mars Descent (0.38g) + Renal Stone Risk',
    description: 'Baja adherencia a ejercicio + deshidratación previo a gravedad marciana -> alerta de Fluid Loading + OIG y riesgo de litiasis.',
    description_en: 'Low exercise adherence + dehydration ahead of Mars gravity re-entry -> Fluid Loading + OIG alert & nephrolithiasis risk.',
    telemetry: withDefaults({
      environment_id: 'mars_base',
      is_planetary_descent_soon: true,
      exercise_adherence_ratio: 0.35,
      water_intake_liters: 1.3,
      urine_output_liters: 0.9,
      urine_specific_gravity: 1.026,
      ionized_calcium_mmol_l: 1.36,
    }),
  },
  sans_dvt_lock: {
    name: 'SANS Severo + Sospecha TVP (Bloqueo LBNP)',
    name_en: 'Severe SANS + DVT Suspicion (LBNP Lockout)',
    description: 'Edema ocular (ONSD 5.9 mm, ΔTRT250 +62 um, IOP 23 mmHg, Amsler alterado) + sospecha de coágulo -> bloquea LBNP y exige POCUS TVP + Thigh Cuffs.',
    description_en: 'Severe ocular edema (ONSD 5.9 mm, ΔTRT250 +62 um, IOP 23 mmHg, positive Amsler) + venous clot suspicion -> locks LBNP, requires DVT POCUS + Thigh Cuffs.',
    telemetry: withDefaults({
      environment_id: 'iss',
      onsd_measured_mm: 5.9,
      oct_trt250_delta_um: 62.0,
      iop_mmhg: 23.0,
      amsler_distortions: 2,
      near_acuity: '20/40',
      pocus_dvt_suspicion: true,
    }),
  },
  acute_renal_colic: {
    name: 'Patología: Cólico Nefrítico / Litiasis Renal',
    name_en: 'Pathology: Renal Colic / Nephrolithiasis',
    description: 'Dolor en flanco + hipercalcemia ionizada (1.46 mmol/L) + oliguria concentrada -> dispara protocolo renal_stone_pocus y PCBA.',
    description_en: 'Flank pain + ionized hypercalcemia (1.46 mmol/L) + concentrated oliguria -> triggers renal POCUS & PCBA electrolyte protocol.',
    telemetry: withDefaults({
      environment_id: 'iss',
      flank_pain: true,
      ionized_calcium_mmol_l: 1.46,
      water_intake_liters: 1.2,
      urine_output_liters: 0.7,
      urine_specific_gravity: 1.028,
      heart_rate_bpm: 98.0,
    }),
  },
  organic_mimic_hypoglycemia: {
    name: 'Alteración Metabólica: Hipoglucemia + Hipoxia (Imitador)',
    name_en: 'Metabolic Imitator: Hypoglycemia + Hypoxia',
    description: 'Glucosa 58 mg/dL + SpO2 91% con ansiedad alta (VAS 8, GAD-2 4) -> el motor bloquea diagnóstico psicológico y prioriza corrección física.',
    description_en: 'Glucose 58 mg/dL + SpO2 91% with high anxiety score -> engine blocks primary anxiety diagnosis and prioritizes physical correction.',
    telemetry: withDefaults({
      environment_id: 'rover',
      glucose_mg_dl: 58.0,
      spo2_percent: 91.0,
      heart_rate_bpm: 108.0,
      hrv_rmssd_ms: 26.0,
      anxiety_vas: 8,
      gad2_score: 4,
    }),
  },
  acute_emergency_stroke_preview: {
    name: 'Emergencia Aguda (Carril 2): Sospecha de ICTUS en Tránsito',
    name_en: 'Acute Emergency (Lane 2): Suspected Stroke in Transit',
    description: 'Simula un evento agudo crítico (PAS 152, SpO2 91%, alteración neurológica) y habilita vista previa de Carril 2 (ABCDE 0g + FAST + Store-and-Forward).',
    description_en: 'Simulates critical acute event (SBP 152, SpO2 91%, neuro deficit) and opens Lane 2 (ABCDE 0g + FAST + Store-and-Forward).',
    open_emergency_modal: true,
    telemetry: withDefaults({
      environment_id: 'transit',
      systolic_bp: 152.0,
      diastolic_bp: 94.0,
      heart_rate_bpm: 92.0,
      spo2_percent: 91.0,
      glucose_mg_dl: 94.0,
      pvt_mean_rt_ms: 410.0,
      pvt_lapses: 3,
    }),
  },
};
