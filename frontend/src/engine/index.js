/**
 * Fachada Offline-First del motor EIMO en navegador.
 * Expone los mismos contratos que backend/main.py para uso directo sin servidor.
 */

import protocolosRaw from './protocolos.json';
import { ENVIRONMENTS, getEnvironment, localizeEnv } from './swapMatrix.js';
import { DEMO_SCENARIOS } from './scenarios.js';
import {
  DEFAULT_BASELINE_PROFILE,
  evaluateFullMissionState,
  normalizeBaselineProfile,
  normalizeTelemetryInput,
  resolveAge,
  resolveMissionDay,
  stepTelemetryDt,
} from './physicsEngine.js';
import {
  clearEvaluationLogs,
  clearTransmittedQueue,
  enqueueStoreAndForward,
  getRecentEvaluations,
  getStoreAndForwardQueue,
  loadBaselineProfile,
  logEvaluation,
  saveBaselineProfile,
  syncSinglePacket,
  syncStoreAndForwardQueue,
  updateStoreAndForwardPacket,
} from './localStore.js';

function todayIsoMinusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(0, Number(days) || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getResolvedProfile() {
  const saved = loadBaselineProfile();
  const profile = normalizeBaselineProfile(saved || DEFAULT_BASELINE_PROFILE);
  if (!saved) {
    saveBaselineProfile(profile);
  }
  return profile;
}

export const localApi = {
  async getEnvironments(lang = 'es') {
    const out = {};
    for (const [k, v] of Object.entries(ENVIRONMENTS)) {
      out[k] = localizeEnv(v, lang);
    }
    return { environments: out };
  },

  async getProtocols(lang = 'es') {
    if (lang !== 'en') {
      return { protocols: protocolosRaw };
    }
    const localized = {};
    for (const [pid, p] of Object.entries(protocolosRaw)) {
      localized[pid] = {
        ...p,
        title: p.title_en || p.title,
        clinical_rationale: p.clinical_rationale_en || p.clinical_rationale,
        risk_domain: p.risk_domain_en || p.risk_domain,
        steps: p.steps_en || p.steps,
        decision_thresholds: p.decision_thresholds_en || p.decision_thresholds,
      };
    }
    return { protocols: localized };
  },

  async getScenarios(lang = 'es') {
    if (lang !== 'en') {
      return { scenarios: DEMO_SCENARIOS };
    }
    const localized = {};
    for (const [sid, sc] of Object.entries(DEMO_SCENARIOS)) {
      localized[sid] = {
        ...sc,
        name: sc.name_en || sc.name,
        description: sc.description_en || sc.description,
      };
    }
    return { scenarios: localized };
  },

  async getBaseline() {
    const data = getResolvedProfile();
    if (!data.launch_date) {
      data.launch_date = todayIsoMinusDays(data.mission_day);
    }
    data.mission_day = resolveMissionDay(data);
    data.age = resolveAge(data);
    return { baseline: data };
  },

  async saveBaseline(profile) {
    const data = normalizeBaselineProfile(profile);
    if (data.auto_advance_mission_day && !data.launch_date) {
      data.launch_date = todayIsoMinusDays(data.mission_day);
    }
    data.mission_day = resolveMissionDay(data);
    data.age = resolveAge(data);
    const saved = saveBaselineProfile(data);
    return { baseline: saved };
  },

  async evaluateTelemetry(telemetry, lang = 'es', persist = true) {
    const profile = getResolvedProfile();
    const normalizedTel = normalizeTelemetryInput(telemetry);
    const result = evaluateFullMissionState(profile, normalizedTel, lang);
    result.environment = localizeEnv(result.environment, lang);
    if (persist) {
      result.log_id = logEvaluation(normalizedTel.environment_id, result.global_status, normalizedTel);
    }
    return result;
  },

  async stepTelemetry(telemetry, dtMinutes = 5.0, persist = false, lang = 'es') {
    const profile = getResolvedProfile();
    const nextTelemetry = stepTelemetryDt(telemetry, dtMinutes, profile);
    const result = evaluateFullMissionState(profile, nextTelemetry, lang);
    result.environment = localizeEnv(result.environment, lang);
    if (persist) {
      result.log_id = logEvaluation(nextTelemetry.environment_id, result.global_status, nextTelemetry);
    }
    result.telemetry = nextTelemetry;
    return result;
  },

  async getHistory() {
    return { history: getRecentEvaluations(15) };
  },

  async clearHistory() {
    const cleared = clearEvaluationLogs();
    return { cleared, history: [] };
  },

  async sendEmergencyStoreForward(packetReq, lang = 'es') {
    const rawEnv = getEnvironment(packetReq.environment_id);
    const env = localizeEnv(rawEnv, lang);
    const profile = getResolvedProfile();
    const payload = {
      crew_member: profile.callsign,
      blood_type: profile.blood_type,
      allergies: profile.allergies,
      environment: env.name,
      red_flag_type: packetReq.red_flag_type || 'Evaluación Aguda ABCDE (En curso)',
      fast_scale: {
        face_asymmetry: Boolean(packetReq.fast_face_asymmetry),
        arm_drift: Boolean(packetReq.fast_arm_drift),
        speech_slurred: Boolean(packetReq.fast_speech_slurred),
        onset_time: packetReq.symptom_onset_time || '',
      },
      gcs_score: packetReq.gcs_score ?? null,
      hypoglycemia_ruled_out:
        packetReq.capillary_glucose_mg_dl !== null && packetReq.capillary_glucose_mg_dl !== undefined
          ? packetReq.capillary_glucose_mg_dl >= 70.0
          : null,
      vitals: {
        glucose_mg_dl: packetReq.capillary_glucose_mg_dl ?? null,
        bp:
          packetReq.systolic_bp !== null &&
          packetReq.systolic_bp !== undefined &&
          packetReq.diastolic_bp !== null &&
          packetReq.diastolic_bp !== undefined
            ? `${packetReq.systolic_bp}/${packetReq.diastolic_bp} mmHg`
            : null,
        hr_bpm: packetReq.heart_rate_bpm ?? null,
        spo2_percent: packetReq.spo2_percent ?? null,
      },
      elapsed_seconds: packetReq.elapsed_seconds ?? 0,
      notes: packetReq.notes || '',
    };

    let packet = null;
    if (packetReq.packet_id !== null && packetReq.packet_id !== undefined) {
      packet = updateStoreAndForwardPacket(
        packetReq.packet_id,
        payload.red_flag_type,
        env.rtt_seconds,
        payload
      );
    }
    if (!packet) {
      packet = enqueueStoreAndForward(payload.red_flag_type, env.rtt_seconds, payload);
    }
    return { packet, environment: env };
  },

  async getEmergencyQueue() {
    return { queue: getStoreAndForwardQueue(20) };
  },

  async syncEmergencyQueue() {
    const syncedCount = syncStoreAndForwardQueue();
    return { synced_count: syncedCount, queue: getStoreAndForwardQueue(20) };
  },

  async syncEmergencyPacket(packetId) {
    const syncedCount = syncSinglePacket(packetId);
    return { synced_count: syncedCount, queue: getStoreAndForwardQueue(20) };
  },

  async clearTransmittedQueue() {
    const cleared = clearTransmittedQueue();
    return { cleared, queue: getStoreAndForwardQueue(20) };
  },
};
