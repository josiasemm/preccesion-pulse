/**
 * Matriz Multi-Entorno (SWaP: Size, Weight, and Power) y Parámetros Físicos Orbitales.
 * Paridad 1:1 con backend/swap_matrix.py para ejecución autónoma en navegador.
 */

export const G0 = 9.80665; // m/s^2 (Gravedad estándar terrestre)
export const SPEED_OF_LIGHT_KM_S = 299792.458; // km/s

export const ENVIRONMENTS = {
  iss: {
    id: 'iss',
    name: 'Estación Espacial (LEO / ISS)',
    name_en: 'Space Station (LEO / ISS)',
    g_ratio: 0.0,
    g_eff_m_s2: 0.0,
    distance_earth_km: 408.0,
    rtt_seconds: 0.05,
    rtt_label: 'Tiempo real (~0.05 s)',
    rtt_label_en: 'Real-time (~0.05 s)',
    radiation_zone: 'LEO (Escudo geomagnético + SAA)',
    radiation_zone_en: 'LEO (Geomagnetic shield + SAA)',
    default_shielding_g_cm2: 20.0,
    base_gcr_msv_day: 0.45,
    cabin_volume_m3: 388.0,
    cdra_design_crew: 4,
    available_hardware: [
      'Tempus Pro',
      'Ultrasound-2 (POCUS)',
      'OCT',
      'Fundoscopio Digital',
      'PCBA (Abbott i-STAT)',
      'ARED',
      'T2 Treadmill',
      'CEVIS',
      'LBNP',
      'Thigh Cuffs',
      'ARCHeR',
      'CANS',
      'OIG / Kentavr',
      'CMRS',
      'DEA',
      'CDRA',
      'Storm Shelter',
    ],
  },
  transit: {
    id: 'transit',
    name: 'Nave en Tránsito Profundo (Orion / Marte)',
    name_en: 'Deep-Space Transit (Orion / Mars)',
    g_ratio: 0.0,
    g_eff_m_s2: 0.0,
    distance_earth_km: 128000000.0,
    rtt_seconds: 854.0,
    rtt_label: '14m 14s RTT (Modo Autónomo EIMO)',
    rtt_label_en: '14m 14s RTT (Autonomous EIMO)',
    radiation_zone: 'Espacio Profundo (Sin magnetosfera)',
    radiation_zone_en: 'Deep Space (No magnetosphere)',
    default_shielding_g_cm2: 15.0,
    base_gcr_msv_day: 1.8,
    cabin_volume_m3: 90.0,
    cdra_design_crew: 4,
    available_hardware: [
      'Tempus Pro',
      'Ultrasound-2 (POCUS)',
      'Fundoscopio Digital',
      'PCBA (Abbott i-STAT)',
      'Zero T2',
      'LBNP',
      'Thigh Cuffs',
      'ARCHeR',
      'CANS',
      'OIG / Kentavr',
      'CMRS',
      'DEA',
      'CDRA',
      'Storm Shelter',
    ],
  },
  rover: {
    id: 'rover',
    name: 'Rover de Exploración Lunar (Artemis)',
    name_en: 'Lunar Exploration Rover (Artemis)',
    g_ratio: 0.165,
    g_eff_m_s2: Math.round(0.165 * G0 * 1000) / 1000,
    distance_earth_km: 384400.0,
    rtt_seconds: 2.6,
    rtt_label: '2.6 s RTT (Cislunar)',
    rtt_label_en: '2.6 s RTT (Cislunar)',
    radiation_zone: 'Superficie Lunar (Sin atmósfera/magnetosfera)',
    radiation_zone_en: 'Lunar Surface (No atmosphere/magnetosphere)',
    default_shielding_g_cm2: 5.0,
    base_gcr_msv_day: 1.1,
    cabin_volume_m3: 14.0,
    cdra_design_crew: 2,
    available_hardware: [
      'Tempus Pro',
      'Ultrasound-2 (POCUS)',
      'PCBA (Abbott i-STAT)',
      'Thigh Cuffs',
      'ARCHeR',
      'CANS',
      'DEA',
    ],
  },
  mars_base: {
    id: 'mars_base',
    name: 'Base Planetaria en Marte',
    name_en: 'Mars Planetary Base',
    g_ratio: 0.38,
    g_eff_m_s2: Math.round(0.38 * G0 * 1000) / 1000,
    distance_earth_km: 225000000.0,
    rtt_seconds: 1501.0,
    rtt_label: '25m 01s RTT (EIMO Crítico)',
    rtt_label_en: '25m 01s RTT (EIMO Critical)',
    radiation_zone: 'Superficie Marciana (Atmósfera CO2 delgada + Regolito)',
    radiation_zone_en: 'Martian Surface (Thin CO2 atm + Regolith)',
    default_shielding_g_cm2: 30.0,
    base_gcr_msv_day: 0.7,
    cabin_volume_m3: 250.0,
    cdra_design_crew: 4,
    available_hardware: [
      'Tempus Pro',
      'Ultrasound-2 (POCUS)',
      'OCT',
      'Fundoscopio Digital',
      'PCBA (Abbott i-STAT)',
      'ARED',
      'Zero T2',
      'LBNP',
      'Thigh Cuffs',
      'ARCHeR',
      'CANS',
      'OIG / Kentavr',
      'CMRS',
      'DEA',
      'CDRA',
      'Storm Shelter',
    ],
  },
};

export const SHIELDING_POSTURES = {
  eva: 1.5,
  nominal: 15.0,
  storm_shelter: 45.0,
};

export function getEnvironment(envId) {
  return ENVIRONMENTS[envId] || ENVIRONMENTS.iss;
}

export function isHardwareAvailable(envId, deviceName) {
  const env = getEnvironment(envId);
  return env.available_hardware.includes(deviceName);
}

export function localizeEnv(env, lang = 'es') {
  const out = { ...env };
  if (lang === 'en') {
    out.name = env.name_en || env.name;
    out.rtt_label = env.rtt_label_en || env.rtt_label;
    out.radiation_zone = env.radiation_zone_en || env.radiation_zone;
  }
  return out;
}
