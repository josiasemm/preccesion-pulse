"""
Matriz Multi-Entorno (SWaP: Size, Weight, and Power) y Parámetros Físicos Orbitales.
Ajusta gravedad efectiva (g_eff), latencia de comunicación Tierra-Nave (RTT = 2d / c),
blindaje nominal (x en g/cm^2) e inventario médico disponible a bordo.
"""

from typing import Dict, Any

G0 = 9.80665  # m/s^2 (Gravedad estándar terrestre)
SPEED_OF_LIGHT_KM_S = 299792.458  # km/s

ENVIRONMENTS: Dict[str, Dict[str, Any]] = {
    "iss": {
        "id": "iss",
        "name": "Estación Espacial (LEO / ISS)",
        "name_en": "Space Station (LEO / ISS)",
        "g_ratio": 0.0,
        "g_eff_m_s2": 0.0,
        "distance_earth_km": 408.0,
        "rtt_seconds": 0.05,  # Tiempo real vía TDRS
        "rtt_label": "Tiempo real (~0.05 s)",
        "rtt_label_en": "Real-time (~0.05 s)",
        "radiation_zone": "LEO (Escudo geomagnético + SAA)",
        "radiation_zone_en": "LEO (Geomagnetic shield + SAA)",
        "default_shielding_g_cm2": 20.0,  # Blindaje aluminio/polietileno de estación
        "base_gcr_msv_day": 0.45,  # ~0.4-0.5 mSv/día en ISS (incluye neutrones secundarios)
        "cabin_volume_m3": 388.0,  # Volumen habitable ISS
        "cdra_design_crew": 4,
        "available_hardware": [
            "Tempus Pro",
            "Ultrasound-2 (POCUS)",
            "OCT",
            "Fundoscopio Digital",
            "PCBA (Abbott i-STAT)",
            "ARED",
            "T2 Treadmill",
            "CEVIS",
            "LBNP",
            "Thigh Cuffs",
            "ARCHeR",
            "CANS",
            "OIG / Kentavr",
            "CMRS",
            "DEA",
            "CDRA",
            "Storm Shelter",
        ],
    },
    "transit": {
        "id": "transit",
        "name": "Nave en Tránsito Profundo (Orion / Marte)",
        "name_en": "Deep-Space Transit (Orion / Mars)",
        "g_ratio": 0.0,
        "g_eff_m_s2": 0.0,
        "distance_earth_km": 128000000.0,  # 128M km -> ~427 s ida (7m 07s) -> 854 s RTT (14m 14s)
        "rtt_seconds": 854.0,
        "rtt_label": "14m 14s RTT (Modo Autónomo EIMO)",
        "rtt_label_en": "14m 14s RTT (Autonomous EIMO)",
        "radiation_zone": "Espacio Profundo (Sin magnetosfera)",
        "radiation_zone_en": "Deep Space (No magnetosphere)",
        "default_shielding_g_cm2": 15.0,
        "base_gcr_msv_day": 1.80,  # GCR interplanetario sin escudo geomagnético
        "cabin_volume_m3": 90.0,
        "cdra_design_crew": 4,
        "available_hardware": [
            "Tempus Pro",
            "Ultrasound-2 (POCUS)",
            "Fundoscopio Digital",
            "PCBA (Abbott i-STAT)",
            "Zero T2",
            "LBNP",
            "Thigh Cuffs",
            "ARCHeR",
            "CANS",
            "OIG / Kentavr",
            "CMRS",
            "DEA",
            "CDRA",
            "Storm Shelter",
        ],
    },
    "rover": {
        "id": "rover",
        "name": "Rover de Exploración Lunar (Artemis)",
        "name_en": "Lunar Exploration Rover (Artemis)",
        "g_ratio": 0.165,
        "g_eff_m_s2": round(0.165 * G0, 3),  # ~1.618 m/s^2
        "distance_earth_km": 384400.0,
        "rtt_seconds": 2.6,  # ~1.3 s ida + 1.3 s vuelta
        "rtt_label": "2.6 s RTT (Cislunar)",
        "rtt_label_en": "2.6 s RTT (Cislunar)",
        "radiation_zone": "Superficie Lunar (Sin atmósfera/magnetosfera)",
        "radiation_zone_en": "Lunar Surface (No atmosphere/magnetosphere)",
        "default_shielding_g_cm2": 5.0,  # Cabina ligera presurizada (sin refugio SPE ni CDRA completo)
        "base_gcr_msv_day": 1.10,  # Horizonte lunar bloquea 50% del cielo (2 pi)
        "cabin_volume_m3": 14.0,
        "cdra_design_crew": 2,
        "available_hardware": [
            "Tempus Pro",
            "Ultrasound-2 (POCUS)",
            "PCBA (Abbott i-STAT)",
            "Thigh Cuffs",
            "ARCHeR",
            "CANS",
            "DEA",
        ],
    },
    "mars_base": {
        "id": "mars_base",
        "name": "Base Planetaria en Marte",
        "name_en": "Mars Planetary Base",
        "g_ratio": 0.38,
        "g_eff_m_s2": round(0.38 * G0, 3),  # ~3.727 m/s^2
        "distance_earth_km": 225000000.0,  # 225M km -> ~750.5 s ida -> 1501 s RTT (25m 01s)
        "rtt_seconds": 1501.0,
        "rtt_label": "25m 01s RTT (EIMO Crítico)",
        "rtt_label_en": "25m 01s RTT (EIMO Critical)",
        "radiation_zone": "Superficie Marciana (Atmósfera CO2 delgada + Regolito)",
        "radiation_zone_en": "Martian Surface (Thin CO2 atm + Regolith)",
        "default_shielding_g_cm2": 30.0,  # Hábitat con blindaje de regolito/agua
        "base_gcr_msv_day": 0.70,
        "cabin_volume_m3": 250.0,
        "cdra_design_crew": 4,
        "available_hardware": [
            "Tempus Pro",
            "Ultrasound-2 (POCUS)",
            "OCT",
            "Fundoscopio Digital",
            "PCBA (Abbott i-STAT)",
            "ARED",
            "Zero T2",
            "LBNP",
            "Thigh Cuffs",
            "ARCHeR",
            "CANS",
            "OIG / Kentavr",
            "CMRS",
            "DEA",
            "CDRA",
            "Storm Shelter",
        ],
    },
}

SHIELDING_POSTURES: Dict[str, float] = {
    "eva": 1.5,            # Traje espacial: blindaje mínimo (~1.5 g/cm^2)
    "nominal": 15.0,       # Referencia base (sobreescrita por default_shielding_g_cm2 del vehículo)
    "storm_shelter": 45.0, # Refugio rodeado de agua/polietileno rico en hidrógeno
}


def get_environment(env_id: str) -> Dict[str, Any]:
    return ENVIRONMENTS.get(env_id, ENVIRONMENTS["iss"])


def is_hardware_available(env_id: str, device_name: str) -> bool:
    env = get_environment(env_id)
    return device_name in env["available_hardware"]
