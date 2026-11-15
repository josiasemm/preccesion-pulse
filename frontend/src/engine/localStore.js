/**
 * Almacenamiento Offline-First en navegador (localStorage con respaldo en memoria).
 * Replica las tablas baseline_profile, evaluation_logs y store_and_forward_queue de SQLite.
 */

const KEYS = {
  BASELINE: 'eimo_db_baseline_v1',
  EVALUATIONS: 'eimo_db_evaluations_v1',
  QUEUE: 'eimo_db_queue_v1',
  SEQ_EVAL: 'eimo_db_seq_eval_v1',
  SEQ_QUEUE: 'eimo_db_seq_queue_v1',
};

const memoryStore = new Map();

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

function readJson(key, fallback) {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  writeRaw(key, JSON.stringify(value));
}

function nextId(seqKey) {
  const current = Number(readRaw(seqKey) || '0');
  const next = Number.isFinite(current) ? current + 1 : 1;
  writeRaw(seqKey, String(next));
  return next;
}

export function loadBaselineProfile() {
  const parsed = readJson(KEYS.BASELINE, null);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
}

export function saveBaselineProfile(profileDict) {
  writeJson(KEYS.BASELINE, profileDict);
  return profileDict;
}

export function logEvaluation(envId, globalStatus, telemetry) {
  const id = nextId(KEYS.SEQ_EVAL);
  const createdAt = new Date().toISOString();
  const rows = readJson(KEYS.EVALUATIONS, []);
  const nextRows = [
    {
      id,
      environment_id: envId,
      global_status: globalStatus,
      telemetry,
      created_at: createdAt,
    },
    ...(Array.isArray(rows) ? rows : []),
  ].slice(0, 100);
  writeJson(KEYS.EVALUATIONS, nextRows);
  return id;
}

export function getRecentEvaluations(limit = 15) {
  const rows = readJson(KEYS.EVALUATIONS, []);
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

export function clearEvaluationLogs() {
  const rows = readJson(KEYS.EVALUATIONS, []);
  const count = Array.isArray(rows) ? rows.length : 0;
  writeJson(KEYS.EVALUATIONS, []);
  return count;
}

export function enqueueStoreAndForward(eventType, rttSeconds, payload) {
  const packetId = nextId(KEYS.SEQ_QUEUE);
  const createdAt = new Date().toISOString();
  const packet = {
    packet_id: packetId,
    event_type: eventType,
    rtt_seconds: rttSeconds,
    payload,
    status: 'QUEUED_FOR_EARTH_LINK',
    created_at: createdAt,
  };
  const queue = readJson(KEYS.QUEUE, []);
  const nextQueue = [packet, ...(Array.isArray(queue) ? queue : [])].slice(0, 100);
  writeJson(KEYS.QUEUE, nextQueue);
  return packet;
}

export function updateStoreAndForwardPacket(packetId, eventType, rttSeconds, payload) {
  const queue = readJson(KEYS.QUEUE, []);
  if (!Array.isArray(queue)) return null;
  const idx = queue.findIndex((p) => p.packet_id === packetId);
  if (idx === -1 || queue[idx].status !== 'QUEUED_FOR_EARTH_LINK') {
    return null;
  }
  const updated = {
    ...queue[idx],
    event_type: eventType,
    rtt_seconds: rttSeconds,
    payload,
  };
  const nextQueue = [...queue];
  nextQueue[idx] = updated;
  writeJson(KEYS.QUEUE, nextQueue);
  return updated;
}

export function getStoreAndForwardQueue(limit = 20) {
  const queue = readJson(KEYS.QUEUE, []);
  return Array.isArray(queue) ? queue.slice(0, limit) : [];
}

export function syncStoreAndForwardQueue() {
  const queue = readJson(KEYS.QUEUE, []);
  if (!Array.isArray(queue)) return 0;
  let synced = 0;
  const nextQueue = queue.map((p) => {
    if (p.status === 'QUEUED_FOR_EARTH_LINK') {
      synced += 1;
      return { ...p, status: 'TRANSMITTED_TO_MCC' };
    }
    return p;
  });
  writeJson(KEYS.QUEUE, nextQueue);
  return synced;
}

export function syncSinglePacket(packetId) {
  const queue = readJson(KEYS.QUEUE, []);
  if (!Array.isArray(queue)) return 0;
  let synced = 0;
  const nextQueue = queue.map((p) => {
    if (p.packet_id === packetId && p.status === 'QUEUED_FOR_EARTH_LINK') {
      synced = 1;
      return { ...p, status: 'TRANSMITTED_TO_MCC' };
    }
    return p;
  });
  writeJson(KEYS.QUEUE, nextQueue);
  return synced;
}

export function clearTransmittedQueue() {
  const queue = readJson(KEYS.QUEUE, []);
  if (!Array.isArray(queue)) return 0;
  const kept = queue.filter((p) => p.status === 'QUEUED_FOR_EARTH_LINK');
  const cleared = queue.length - kept.length;
  writeJson(KEYS.QUEUE, kept);
  return cleared;
}
