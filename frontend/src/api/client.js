import { localApi } from '../engine/index.js';

const REMOTE_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${REMOTE_API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

const remoteApi = {
  getEnvironments: (lang = 'es') => request(`/environments?lang=${encodeURIComponent(lang)}`),
  getProtocols: (lang = 'es') => request(`/protocols?lang=${encodeURIComponent(lang)}`),
  getScenarios: (lang = 'es') => request(`/scenarios?lang=${encodeURIComponent(lang)}`),
  getBaseline: () => request('/baseline'),
  saveBaseline: (profile) =>
    request('/baseline', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
  evaluateTelemetry: (telemetry, lang = 'es', persist = true) =>
    request(`/evaluate?lang=${encodeURIComponent(lang)}&persist=${persist ? 'true' : 'false'}`, {
      method: 'POST',
      body: JSON.stringify(telemetry),
    }),
  stepTelemetry: (telemetry, dtMinutes = 5.0, persist = false, lang = 'es') =>
    request(`/step?lang=${encodeURIComponent(lang)}`, {
      method: 'POST',
      body: JSON.stringify({ telemetry, dt_minutes: dtMinutes, persist }),
    }),
  getHistory: () => request('/history'),
  clearHistory: () =>
    request('/history', {
      method: 'DELETE',
    }),
  sendEmergencyStoreForward: (packet, lang = 'es') =>
    request(`/emergency-store-forward?lang=${encodeURIComponent(lang)}`, {
      method: 'POST',
      body: JSON.stringify(packet),
    }),
  getEmergencyQueue: () => request('/emergency-queue'),
  syncEmergencyQueue: () =>
    request('/emergency-queue/sync', {
      method: 'POST',
    }),
  syncEmergencyPacket: (packetId) =>
    request(`/emergency-queue/${packetId}/sync`, {
      method: 'POST',
    }),
  clearTransmittedQueue: () =>
    request('/emergency-queue/transmitted', {
      method: 'DELETE',
    }),
};

// Por defecto corre 100% offline-first en el navegador (ideal para GitHub Pages).
// Si se define VITE_API_BASE_URL, delega las peticiones al backend FastAPI remoto.
export const api = REMOTE_API_BASE ? remoteApi : localApi;
