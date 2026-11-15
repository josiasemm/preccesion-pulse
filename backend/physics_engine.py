"""
Motor Biofísico y Clínico Acoplado (EIMO — Engine for In-Flight Medical Operations).
Implementa 5 módulos físico-clínicos deterministas sobre umbrales verificados de
NASA-STD-3001 / OCHMO-STD-100.1A / REMM, descarte orgánico de ansiedad en 3 capas
y filtrado dinámico por inventario SWaP.
"""

from datetime import date
import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from swap_matrix import get_environment, is_hardware_available, SHIELDING_POSTURES, G0

# Constantes físicas y fisiológicas verificadas
RHO_BLOOD_KG_M3 = 1060.0       # Densidad media de la sangre humana (kg/m^3)
PA_PER_MMHG = 133.322          # Factor de conversión Pascal a mmHg
HEAD_HEART_DIST_M = 0.35       # Distancia vertical media corazón -> cabeza/ojo (m)
TAU_PLASMA_DAYS = 2.5          # Constante de tiempo de relajación de volumen plasmático (días)

# Límites oficiales NASA-STD-3001 y REMM
LIMIT_PPCO2_MMHG = 3.0         # NASA-STD-3001 [V2 6004] promedio 1h (evaluación conservadora instantánea)
LIMIT_NOISE_CAUTION_DBA = 60.0 # NASA-STD-3001 [V2 6078] / NC-50 ambiente habitable continuo
LIMIT_NOISE_CRITICAL_DBA = 85.0# NASA-STD-3001 [V2 6080] riesgo auditivo / requiere protección
LIMIT_RAD_CAREER_MSV = 600.0   # NASA-STD-3001 [V1 4030] límite estocástico efectivo de carrera (mSv)
LIMIT_BFO_30D_MGYEQ = 250.0    # NASA-STD-3001 límite determinístico BFO 30 días (mGy-Eq)
LIMIT_BFO_1YR_MGYEQ = 500.0    # NASA-STD-3001 límite determinístico BFO 1 año (mGy-Eq)
PVT_LAPSE_THRESHOLD_MS = 355   # Umbral de lapsus en NASA Brief PVT (PVT-B, 3-min)


class BaselineProfile(BaseModel):
    callsign: str = Field(default="Cmdr. Josías M.", max_length=80)
    role: str = Field(default="Oficial Médico de Tripulación (CMO)", max_length=100)
    birth_date: str | None = "2000-05-15"
    age: int = Field(default=26, ge=18, le=90)
    sex: str = Field(default="M", max_length=16)
    weight_kg: float = Field(default=72.0, ge=35.0, le=200.0)
    height_cm: float = Field(default=175.0, ge=120.0, le=230.0)
    blood_type: str = Field(default="O+", max_length=8)
    allergies: str = Field(default="Ninguna", max_length=200)
    active_meds: List[str] = Field(default_factory=lambda: ["Complejo B"])
    uses_glasses: bool = False
    baseline_refraction_diopters: float = Field(default=0.0, ge=-15.0, le=15.0)  # Rango OCHMO-STD-100.1A: -5.50 a +5.50 D
    amb_waiver_renal: bool = False
    amb_waiver_orthostatic_or_arrhythmia: bool = False
    # Basales cuantitativos personales
    hr_baseline_bpm: float = Field(default=64.0, ge=30.0, le=140.0)
    hrv_baseline_ms: float = Field(default=48.0, ge=5.0, le=250.0)
    systolic_bp_baseline: float = Field(default=115.0, ge=70.0, le=200.0)
    diastolic_bp_baseline: float = Field(default=74.0, ge=40.0, le=130.0)
    onsd_baseline_mm: float = Field(default=4.2, ge=2.5, le=8.0)
    iop_baseline_mmhg: float = Field(default=14.0, ge=5.0, le=45.0)
    oct_trt250_baseline_um: float = Field(default=340.0, ge=150.0, le=600.0)
    bmd_tscore_baseline: float = Field(default=0.2, ge=-5.0, le=5.0)
    pvt_baseline_ms: float = Field(default=235.0, ge=120.0, le=600.0)
    alc_baseline_cells_ul: float = Field(default=2100.0, ge=200.0, le=8000.0)
    prior_career_rad_msv: float = Field(default=18.0, ge=0.0, le=2000.0)
    mission_day: int = Field(default=45, ge=0, le=50000)
    launch_date: str | None = None
    auto_advance_mission_day: bool = True


def resolve_mission_day(profile: BaselineProfile) -> int:
    """Calcula el día de misión actual desde launch_date si el avance automático está activo."""
    if profile.auto_advance_mission_day and profile.launch_date:
        try:
            launched = date.fromisoformat(profile.launch_date)
            return max(0, (date.today() - launched).days)
        except ValueError:
            pass
    return max(0, profile.mission_day)


def resolve_age(profile: BaselineProfile) -> int:
    """Calcula la edad exacta en años a partir de birth_date."""
    if profile.birth_date:
        try:
            b = date.fromisoformat(profile.birth_date)
            today = date.today()
            return max(0, today.year - b.year - ((today.month, today.day) < (b.month, b.day)))
        except ValueError:
            pass
    return max(0, profile.age)


class TelemetryInput(BaseModel):
    environment_id: Literal["iss", "transit", "rover", "mars_base"] = "iss"
    shielding_posture: Literal["eva", "nominal", "storm_shelter"] = "nominal"
    is_pre_sleep_window: bool = False
    is_planetary_descent_soon: bool = False
    # Telemetría ambiental de cabina
    cabin_ppco2_mmhg: float = Field(default=2.1, ge=0.0, le=30.0)
    cabin_pressure_psia: float = Field(default=14.7, ge=4.0, le=18.0)
    cabin_o2_percent: float = Field(default=21.0, ge=10.0, le=100.0)
    cdra_scrubber_efficiency: float = Field(default=0.95, ge=0.0, le=1.0)    # 0.0 (fallo total) a 1.0 (nominal)
    crew_count: int = Field(default=4, ge=1, le=20)
    spe_event_dose_mgyeq: float = Field(default=0.0, ge=0.0, le=10000.0)    # Dosis aguda BFO medida en blindaje nominal
    hours_since_spe: float = Field(default=24.0, ge=0.0, le=720.0)
    time_to_emesis_hours: float | None = Field(default=None, ge=0.0, le=72.0)
    cabin_noise_dba: float = Field(default=58.0, ge=20.0, le=140.0)
    # Signos vitales y cardiovascular / SANS
    heart_rate_bpm: float = Field(default=68.0, ge=20.0, le=240.0)
    hrv_rmssd_ms: float = Field(default=44.0, ge=1.0, le=300.0)
    systolic_bp: float = Field(default=118.0, ge=40.0, le=260.0)
    diastolic_bp: float = Field(default=76.0, ge=20.0, le=160.0)
    spo2_percent: float = Field(default=98.0, ge=50.0, le=100.0)
    resp_rate_rpm: float = Field(default=14.0, ge=4.0, le=60.0)
    temp_celsius: float = Field(default=36.7, ge=30.0, le=43.0)
    onsd_measured_mm: float = Field(default=4.3, ge=2.0, le=10.0)
    oct_trt250_delta_um: float = Field(default=4.0, ge=-50.0, le=300.0)    # Delta TRT250 NASA SANS (< 20 normal, >= 20 alerta, >= 55 crítico)
    oct_rnfl_delta_um: float | None = Field(default=None, ge=-50.0, le=300.0)
    iop_mmhg: float = Field(default=15.0, ge=4.0, le=60.0)                  # Presión intraocular (normal 12-16 mmHg; alerta > 21 mmHg)
    amsler_distortions: int = Field(default=0, ge=0, le=80)
    near_acuity: str = Field(default="20/20", max_length=16)
    pocus_dvt_suspicion: bool = False
    ecg_arrhythmia_detected: bool = False
    # Musculoesquelético y renal
    exercise_adherence_ratio: float = Field(default=0.90, ge=0.0, le=1.0)
    alendronate_active: bool = False
    potassium_citrate_active: bool = False
    water_intake_liters: float = Field(default=2.4, ge=0.0, le=10.0)
    urine_output_liters: float = Field(default=2.0, ge=0.0, le=10.0)
    urine_specific_gravity: float = Field(default=1.014, ge=1.000, le=1.040)
    ionized_calcium_mmol_l: float = Field(default=1.22, ge=0.5, le=3.0)
    flank_pain: bool = False
    # Neuroconductual y auditivo
    sleep_hours: float = Field(default=7.2, ge=0.0, le=24.0)
    sleep_efficiency_pct: float = Field(default=89.0, ge=0.0, le=100.0)
    sleep_onset_latency_min: float = Field(default=18.0, ge=0.0, le=480.0)
    pvt_mean_rt_ms: float = Field(default=248.0, ge=100.0, le=3000.0)
    pvt_lapses: int = Field(default=0, ge=0, le=100)
    anxiety_vas: int = Field(default=2, ge=1, le=10)                       # 1 a 10
    gad2_score: int = Field(default=0, ge=0, le=6)                         # 0 a 6 (>= 3 positivo)
    audiometry_shift_4khz_db: float = Field(default=5.0, ge=-20.0, le=90.0)
    # Metabólico e inmune
    glucose_mg_dl: float = Field(default=92.0, ge=15.0, le=800.0)
    skin_rash_or_viral_symptoms: bool = False


def _resolve_trt250_delta(telemetry: TelemetryInput) -> float:
    """Unifica OCT a ΔTRT250 (um). Convierte alias heredado oct_rnfl_delta_um si viene solo."""
    if telemetry.oct_trt250_delta_um != 4.0 or telemetry.oct_rnfl_delta_um is None:
        return float(telemetry.oct_trt250_delta_um)
    # Escalado aproximado si solo llega RNFL legado (> 15 um RNFL ~ >= 55 um TRT250)
    return round(float(telemetry.oct_rnfl_delta_um) * 3.65, 1)


def compute_hydrostatics_and_fluids(
    env: Dict[str, Any],
    profile: BaselineProfile,
    telemetry: TelemetryInput,
) -> Dict[str, Any]:
    """
    Modelo 1: Hidrostática (Delta P = rho * g_eff * h) y relajación exponencial
    de volumen plasmático V_p(t) = V_eq + (V_0 - V_eq) * exp(-t / tau_p).
    Nota fisiológica: cephalad_pressure_shift_mmhg representa la pérdida del gradiente
    ortostático de bipedestación respecto a 1g (~+27.3 mmHg en microgravedad).
    """
    g_eff = env["g_eff_m_s2"]
    g_ratio = env["g_ratio"]

    delta_p_earth_mmhg = (RHO_BLOOD_KG_M3 * G0 * HEAD_HEART_DIST_M) / PA_PER_MMHG
    delta_p_current_mmhg = (RHO_BLOOD_KG_M3 * g_eff * HEAD_HEART_DIST_M) / PA_PER_MMHG
    cephalad_pressure_shift_mmhg = round(delta_p_earth_mmhg - delta_p_current_mmhg, 2)

    eq_loss_pct = -13.0 * (1.0 - g_ratio)
    days = resolve_mission_day(profile)
    plasma_volume_change_pct = round(eq_loss_pct * (1.0 - math.exp(-days / TAU_PLASMA_DAYS)), 2)

    # Evaluación de SANS unificada (ONSD + OCT ΔTRT250 + IOP + Amsler + Agudeza cercana)
    onsd_delta = round(telemetry.onsd_measured_mm - profile.onsd_baseline_mm, 2)
    trt250_delta = _resolve_trt250_delta(telemetry)
    sans_risk = "nominal"
    if (
        telemetry.amsler_distortions > 0
        or onsd_delta >= 0.7
        or telemetry.onsd_measured_mm >= 5.8
        or trt250_delta >= 55.0
    ):
        sans_risk = "critical"
    elif (
        onsd_delta >= 0.4
        or telemetry.onsd_measured_mm >= 5.0
        or telemetry.near_acuity != "20/20"
        or trt250_delta >= 20.0
        or telemetry.iop_mmhg > 21.0
    ):
        sans_risk = "caution"

    # Candados de seguridad LBNP alineados con protocolos.json (densidad urinaria < 1.020)
    hypovolemia_lock = (
        telemetry.water_intake_liters < 1.5
        or telemetry.urine_specific_gravity >= 1.020
        or telemetry.systolic_bp < 95.0
    )
    dvt_lock = telemetry.pocus_dvt_suspicion
    cardiac_lock = (
        telemetry.ecg_arrhythmia_detected
        or profile.amb_waiver_orthostatic_or_arrhythmia
    )
    hypoglycemia_lock = telemetry.glucose_mg_dl < 70.0
    lbnp_safe = not (hypovolemia_lock or dvt_lock or cardiac_lock or hypoglycemia_lock)

    return {
        "delta_p_earth_mmhg": round(delta_p_earth_mmhg, 2),
        "delta_p_current_mmhg": round(delta_p_current_mmhg, 2),
        "cephalad_pressure_shift_mmhg": cephalad_pressure_shift_mmhg,
        "plasma_volume_change_pct": plasma_volume_change_pct,
        "onsd_delta_mm": onsd_delta,
        "oct_trt250_delta_um": trt250_delta,
        "sans_risk": sans_risk,
        "lbnp_safe": lbnp_safe,
        "lbnp_locks": {
            "hypovolemia_or_dehydration": hypovolemia_lock,
            "dvt_suspicion": dvt_lock,
            "arrhythmia_or_syncope_waiver": cardiac_lock,
            "hypoglycemia_syncope_risk": hypoglycemia_lock,
        },
    }


def _cdra_rates_mmhg_h(env: Dict[str, Any], telemetry: TelemetryInput) -> tuple[float, float]:
    """
    Generación metabólica de CO2 proporcional a crew_count (~18 m3*mmHg/h/persona),
    frente a capacidad de remoción física del scrubber CDRA fijada al diseño del vehículo
    y proporcional a la presión parcial actual en cabina (sin escalar con crew_count).
    """
    v_cab = max(env["cabin_volume_m3"], 10.0)
    design_crew = env.get("cdra_design_crew", 4)
    metabolic_gen_mmhg_h = (telemetry.crew_count * 18.0) / v_cab
    nominal_design_gen = (design_crew * 18.0) / v_cab
    co2_driving_factor = min(2.5, max(0.3, telemetry.cabin_ppco2_mmhg / 2.1))
    removal_mmhg_h = telemetry.cdra_scrubber_efficiency * nominal_design_gen * 1.15 * co2_driving_factor
    return metabolic_gen_mmhg_h, removal_mmhg_h


def compute_cabin_co2_and_alveolar(
    env: Dict[str, Any],
    telemetry: TelemetryInput,
) -> Dict[str, Any]:
    """
    Modelo 2: Conservación de masa de CO2 en cabina cerrada y Ecuación de Gas Alveolar:
    PIO2 = (P_atm - P_H2O) * FiO2, PAO2 = max(0, PIO2 - (PaCO2 / RQ)), con RQ = 0.82.
    Evalúa hipoxia ambiental (PIO2 < 100 mmHg) e inflamabilidad NASA-STD-3001 [V2 11040] (O2 >= 23.5%).
    """
    metabolic_gen_mmhg_h, removal_mmhg_h = _cdra_rates_mmhg_h(env, telemetry)
    d_ppco2_dt_mmhg_h = round(max(-0.5, metabolic_gen_mmhg_h - removal_mmhg_h), 3)
    projected_ppco2_4h = round(max(0.4, telemetry.cabin_ppco2_mmhg + 4.0 * d_ppco2_dt_mmhg_h), 2)

    p_atm_mmhg = telemetry.cabin_pressure_psia * 51.7149
    ph2o_mmhg = 47.0
    pio2_mmhg = max(0.0, (p_atm_mmhg - ph2o_mmhg) * (telemetry.cabin_o2_percent / 100.0))
    pa_co2_est = 40.0 + max(0.0, (telemetry.cabin_ppco2_mmhg - 0.5) * 1.4)
    rq = 0.82
    p_alveolar_o2_mmhg = round(max(0.0, pio2_mmhg - (pa_co2_est / rq)), 1)

    flammability_alert = telemetry.cabin_o2_percent >= 23.5
    cabin_hypoxia = pio2_mmhg < 100.0

    co2_status = "nominal"
    if telemetry.cabin_ppco2_mmhg >= 5.0 or projected_ppco2_4h >= 6.0:
        co2_status = "critical"
    elif telemetry.cabin_ppco2_mmhg > LIMIT_PPCO2_MMHG or projected_ppco2_4h > LIMIT_PPCO2_MMHG:
        co2_status = "caution"

    return {
        "current_ppco2_mmhg": telemetry.cabin_ppco2_mmhg,
        "limit_ppco2_mmhg": LIMIT_PPCO2_MMHG,
        "d_ppco2_dt_mmhg_h": d_ppco2_dt_mmhg_h,
        "projected_ppco2_4h_mmhg": projected_ppco2_4h,
        "cabin_pressure_psia": telemetry.cabin_pressure_psia,
        "cabin_o2_percent": telemetry.cabin_o2_percent,
        "estimated_inspired_po2_mmhg": round(pio2_mmhg, 1),
        "estimated_alveolar_po2_mmhg": p_alveolar_o2_mmhg,
        "flammability_alert": flammability_alert,
        "cabin_hypoxia": cabin_hypoxia,
        "co2_status": co2_status,
    }


def compute_radiation_and_lymphocytes(
    env: Dict[str, Any],
    profile: BaselineProfile,
    telemetry: TelemetryInput,
) -> Dict[str, Any]:
    """
    Modelo 3: Atenuación exponencial paramétrica respecto al blindaje base del vehículo
    (x_ref = default_shielding_g_cm2) + Cinética de depleción linfocitaria (Andrews/REMM).
    Mantiene separadas las magnitudes dosimétricas: carrera en mSv [V1 4030] y BFO SPE en mGy-Eq.
    """
    x_ref = env["default_shielding_g_cm2"]
    storm_shelter_available = "Storm Shelter" in env.get("available_hardware", [])
    effective_posture = (
        "nominal"
        if (telemetry.shielding_posture == "storm_shelter" and not storm_shelter_available)
        else telemetry.shielding_posture
    )
    x_shield = (
        x_ref
        if effective_posture == "nominal"
        else SHIELDING_POSTURES.get(effective_posture, x_ref)
    )
    lambda_gcr = 140.0  # g/cm^2
    lambda_spe = 12.0   # g/cm^2

    gcr_rate_msv_day = env["base_gcr_msv_day"] * math.exp(-(x_shield - x_ref) / lambda_gcr)
    gcr_rate_msv_day = round(max(0.15, gcr_rate_msv_day), 3)

    # Atenuación SPE relativa al blindaje nominal del vehículo (nominal = 1.0x)
    spe_attenuation = math.exp(-(x_shield - x_ref) / lambda_spe)
    effective_spe_bfo_mgyeq = round(telemetry.spe_event_dose_mgyeq * spe_attenuation, 1)

    # Presupuesto estocástico de carrera en mSv (GCR acumulado + historial previo)
    mission_gcr_msv = round(gcr_rate_msv_day * resolve_mission_day(profile), 2)
    total_career_msv = round(profile.prior_career_rad_msv + mission_gcr_msv, 2)
    remaining_career_budget_msv = round(max(0.0, LIMIT_RAD_CAREER_MSV - total_career_msv), 2)

    # Cinética de depleción linfocitaria continua desde el umbral BFO 0.25 Gy-Eq (Goans/Andrews/REMM)
    d_gy = effective_spe_bfo_mgyeq / 1000.0
    k_depletion_per_h = max(0.0, 0.018 * (d_gy - 0.25))

    predicted_alc = round(
        profile.alc_baseline_cells_ul * math.exp(-k_depletion_per_h * telemetry.hours_since_spe)
    )
    alc_drop_pct = round(
        100.0 * (1.0 - predicted_alc / max(1.0, profile.alc_baseline_cells_ul)),
        1,
    )

    requires_cbc_labs = effective_spe_bfo_mgyeq >= LIMIT_BFO_30D_MGYEQ or (
        telemetry.time_to_emesis_hours is not None and telemetry.time_to_emesis_hours <= 4.0
    )

    rad_status = "nominal"
    if (
        effective_spe_bfo_mgyeq >= LIMIT_BFO_1YR_MGYEQ
        or total_career_msv >= LIMIT_RAD_CAREER_MSV
        or (telemetry.time_to_emesis_hours is not None and telemetry.time_to_emesis_hours < 2.0)
    ):
        rad_status = "critical"
    elif (
        effective_spe_bfo_mgyeq >= LIMIT_BFO_30D_MGYEQ
        or total_career_msv >= 0.8 * LIMIT_RAD_CAREER_MSV
        or (telemetry.time_to_emesis_hours is not None and telemetry.time_to_emesis_hours <= 4.0)
    ):
        rad_status = "caution"

    return {
        "shielding_areal_density_g_cm2": x_shield,
        "storm_shelter_available": storm_shelter_available,
        "shielding_posture_effective": effective_posture,
        "gcr_dose_rate_msv_day": gcr_rate_msv_day,
        "effective_spe_bfo_mgyeq": effective_spe_bfo_mgyeq,
        "total_career_dose_msv": total_career_msv,
        "remaining_career_budget_msv": remaining_career_budget_msv,
        "predicted_alc_cells_ul": predicted_alc,
        "alc_drop_pct": alc_drop_pct,
        "requires_serial_cbc_labs": requires_cbc_labs,
        "rad_status": rad_status,
    }


def _has_med(active_meds: List[str], tokens: tuple[str, ...]) -> bool:
    low = " | ".join(active_meds).lower()
    return any(tok in low for tok in tokens)


def compute_bone_and_renal(
    env: Dict[str, Any],
    profile: BaselineProfile,
    telemetry: TelemetryInput,
) -> Dict[str, Any]:
    """
    Modelo 4: Ley de Wolff (dBMD/dt) acoplada a g_eff, adherencia ARED/Zero T2 y alendronato,
    con cota asintótica fisiológica, más índice relativo de sobresaturación cálcica urinaria.
    """
    g_ratio = env["g_ratio"]
    alpha_res_per_month = 1.4
    eta_ared = 0.65
    eta_bis = 0.30

    has_alendronate = telemetry.alendronate_active or _has_med(profile.active_meds, ("alendronat",))
    has_citrate = telemetry.potassium_citrate_active or _has_med(profile.active_meds, ("citrat",))

    protection_factor = min(
        0.95,
        eta_ared * telemetry.exercise_adherence_ratio + (eta_bis if has_alendronate else 0.0),
    )
    monthly_bmd_loss_pct = round(
        alpha_res_per_month * (1.0 - g_ratio) * (1.0 - protection_factor),
        3,
    )
    months_in_space = max(0.0, resolve_mission_day(profile) / 30.0)
    # Meseta asintótica en -35% para evitar predicciones físicamente imposibles > 100%
    cumulative_bmd_loss_pct = round(-35.0 * (1.0 - math.exp(-(monthly_bmd_loss_pct * months_in_space) / 35.0)), 2)
    projected_bmd_tscore = round(profile.bmd_tscore_baseline + (cumulative_bmd_loss_pct / 10.0), 2)

    citrate_modifier = 0.70 if has_citrate else 1.0
    waiver_modifier = 1.25 if profile.amb_waiver_renal else 1.0
    supersaturation_index = round(
        ((0.4 + monthly_bmd_loss_pct) / max(0.5, telemetry.urine_output_liters))
        * citrate_modifier
        * waiver_modifier,
        2,
    )

    bone_renal_status = "nominal"
    if telemetry.flank_pain or telemetry.ionized_calcium_mmol_l > 1.45 or supersaturation_index >= 1.35:
        bone_renal_status = "critical"
    elif (
        monthly_bmd_loss_pct >= 0.75
        or projected_bmd_tscore <= -1.0
        or supersaturation_index >= 0.90
        or telemetry.urine_specific_gravity >= 1.022
        or telemetry.ionized_calcium_mmol_l > 1.32
    ):
        bone_renal_status = "caution"

    return {
        "monthly_bmd_loss_pct": monthly_bmd_loss_pct,
        "cumulative_bmd_loss_pct": cumulative_bmd_loss_pct,
        "projected_bmd_tscore": projected_bmd_tscore,
        "renal_supersaturation_index": supersaturation_index,
        "alendronate_protected": has_alendronate,
        "citrate_protected": has_citrate,
        "bone_renal_status": bone_renal_status,
    }


def compute_neuro_and_anxiety(
    profile: BaselineProfile,
    telemetry: TelemetryInput,
    lang: str = "es",
) -> Dict[str, Any]:
    """
    Modelo 5: PVT-B + Tamizaje de Ansiedad en 3 Capas + Evaluación Auditiva / Ruido.
    """
    is_en = lang == "en"
    mimic_keys: List[str] = []
    organic_mimics: List[str] = []

    if telemetry.cabin_ppco2_mmhg > LIMIT_PPCO2_MMHG:
        mimic_keys.append("hypercapnia")
        organic_mimics.append(
            f"Hypercapnia (ppCO2 = {telemetry.cabin_ppco2_mmhg} mmHg > 3.0 mmHg)"
            if is_en
            else f"Hipercapnia (ppCO2 = {telemetry.cabin_ppco2_mmhg} mmHg > 3.0 mmHg)"
        )
    pio2_mmhg = max(0.0, ((telemetry.cabin_pressure_psia * 51.7149) - 47.0) * (telemetry.cabin_o2_percent / 100.0))
    if telemetry.spo2_percent < 94.0 or pio2_mmhg < 100.0:
        mimic_keys.append("hypoxia")
        organic_mimics.append(
            f"Hypoxia / hypobaric atmosphere (SpO2 = {telemetry.spo2_percent}%, PIO2 = {round(pio2_mmhg, 1)} mmHg)"
            if is_en
            else f"Hipoxia / atmósfera hipobárica (SpO2 = {telemetry.spo2_percent}%, PIO2 = {round(pio2_mmhg, 1)} mmHg)"
        )
    if telemetry.glucose_mg_dl < 70.0:
        mimic_keys.append("hypoglycemia")
        organic_mimics.append(
            f"Hypoglycemia ({telemetry.glucose_mg_dl} mg/dL < 70 mg/dL)"
            if is_en
            else f"Hipoglucemia ({telemetry.glucose_mg_dl} mg/dL < 70 mg/dL)"
        )

    hrv_drop_pct = round(
        100.0 * (profile.hrv_baseline_ms - telemetry.hrv_rmssd_ms) / max(1.0, profile.hrv_baseline_ms),
        1,
    )
    autonomic_strain = (
        hrv_drop_pct >= 20.0
        or (telemetry.heart_rate_bpm - profile.hr_baseline_bpm) >= 12.0
        or telemetry.sleep_onset_latency_min > 30.0
    )
    psychometric_positive = telemetry.gad2_score >= 3 or telemetry.anxiety_vas >= 6
    anxiety_screen_positive = (len(mimic_keys) == 0) and psychometric_positive and autonomic_strain

    pvt_status = "nominal"
    if telemetry.pvt_mean_rt_ms >= PVT_LAPSE_THRESHOLD_MS or telemetry.pvt_lapses >= 2:
        pvt_status = "critical"
    elif (
        telemetry.pvt_mean_rt_ms >= 280.0
        or telemetry.pvt_lapses == 1
        or telemetry.sleep_hours < 6.0
        or telemetry.sleep_efficiency_pct < 85.0
    ):
        pvt_status = "caution"

    recommend_01hz_breathing = (
        anxiety_screen_positive
        or (telemetry.is_pre_sleep_window and (psychometric_positive or telemetry.sleep_onset_latency_min > 30.0))
    ) and len(mimic_keys) == 0

    noise_status = "nominal"
    if telemetry.cabin_noise_dba >= LIMIT_NOISE_CRITICAL_DBA:
        noise_status = "critical"
    elif telemetry.cabin_noise_dba > LIMIT_NOISE_CAUTION_DBA:
        noise_status = "caution"

    neuro_status = pvt_status
    if anxiety_screen_positive and neuro_status == "nominal":
        neuro_status = "caution"
    if (telemetry.audiometry_shift_4khz_db >= 15.0 or noise_status == "caution") and neuro_status == "nominal":
        neuro_status = "caution"
    if noise_status == "critical":
        neuro_status = "critical"

    return {
        "pvt_status": pvt_status,
        "hrv_drop_pct": hrv_drop_pct,
        "organic_mimic_keys": mimic_keys,
        "organic_mimics_detected": organic_mimics,
        "anxiety_screen_positive": anxiety_screen_positive,
        "recommend_01hz_breathing": recommend_01hz_breathing,
        "avoid_blue_light_and_caffeine": recommend_01hz_breathing or telemetry.is_pre_sleep_window,
        "resonance_frequency_hz": 0.1,
        "noise_status": noise_status,
        "neuro_status": neuro_status,
    }


def evaluate_full_mission_state(
    profile: BaselineProfile,
    telemetry: TelemetryInput,
    lang: str = "es",
) -> Dict[str, Any]:
    """
    Ejecuta los 5 modelos acoplados, determina el estado de las 4 zonas anatómicas
    y construye la lista priorizada de alertas y contramedidas filtrada por SWaP.
    """
    is_en = lang == "en"
    env = get_environment(telemetry.environment_id)
    env_id = env["id"]

    m1 = compute_hydrostatics_and_fluids(env, profile, telemetry)
    m2 = compute_cabin_co2_and_alveolar(env, telemetry)
    m3 = compute_radiation_and_lymphocytes(env, profile, telemetry)
    m4 = compute_bone_and_renal(env, profile, telemetry)
    m5 = compute_neuro_and_anxiety(profile, telemetry, lang=lang)

    def worst_status(*statuses: str) -> str:
        if "critical" in statuses:
            return "critical"
        if "caution" in statuses:
            return "caution"
        return "nominal"

    bp_critical = telemetry.systolic_bp >= 150.0 or telemetry.diastolic_bp >= 95.0 or telemetry.systolic_bp < 90.0
    hr_abnormal = telemetry.heart_rate_bpm < 45.0 or telemetry.heart_rate_bpm > 110.0

    zones = {
        "head_neuro_ocular": worst_status(m1["sans_risk"], m5["neuro_status"]),
        "thorax_cardio_resp": worst_status(
            m2["co2_status"],
            "critical" if (telemetry.spo2_percent < 90 or telemetry.ecg_arrhythmia_detected or bp_critical) else (
                "caution" if (telemetry.spo2_percent < 94 or hr_abnormal or m2["flammability_alert"] or m2["cabin_hypoxia"]) else "nominal"
            ),
        ),
        "musculoskeletal_renal": "critical" if telemetry.pocus_dvt_suspicion else m4["bone_renal_status"],
        "systemic_radiation_immune": worst_status(
            m3["rad_status"],
            "critical" if telemetry.glucose_mg_dl < 70 else (
                "caution" if (telemetry.glucose_mg_dl > 125 or telemetry.skin_rash_or_viral_symptoms) else "nominal"
            ),
        ),
    }

    global_status = worst_status(*zones.values())
    priorities: List[Dict[str, Any]] = []

    # 1. Amenazas ambientales / respiratorias / hemodinámicas agudas
    if m2["co2_status"] != "nominal":
        is_co2_predictive = telemetry.cabin_ppco2_mmhg <= LIMIT_PPCO2_MMHG
        priorities.append({
            "severity": m2["co2_status"],
            "title": (
                (
                    f"Rising Cabin ppCO2 / CDRA Fault ({telemetry.cabin_ppco2_mmhg} → {m2['projected_ppco2_4h_mmhg']} mmHg in 4h)"
                    if is_co2_predictive
                    else f"Elevated Cabin ppCO2 ({telemetry.cabin_ppco2_mmhg} mmHg)"
                )
                if is_en
                else (
                    f"ppCO2 en Ascenso por Fallo CDRA ({telemetry.cabin_ppco2_mmhg} → {m2['projected_ppco2_4h_mmhg']} mmHg en 4h)"
                    if is_co2_predictive
                    else f"ppCO2 Ambiental Elevada ({telemetry.cabin_ppco2_mmhg} mmHg)"
                )
            ),
            "detail": (
                f"Exceeds NASA-STD-3001 (<= 3.0 mmHg). 4h projection: {m2['projected_ppco2_4h_mmhg']} mmHg. "
                "Causes headache, cerebral vasodilation (worsens SANS) and slows PVT."
                if is_en
                else f"Supera el límite NASA-STD-3001 (<= 3.0 mmHg). Proyección a 4h: {m2['projected_ppco2_4h_mmhg']} mmHg. "
                "Causa cefalea, vasodilatación cerebral (agrava SANS) y enlentece el PVT."
            ),
            "action": (
                "Activate local forced ventilation, verify CDRA/amine scrubber and pause strenuous exercise."
                if is_en
                else "Activar ventilación forzada local, verificar scrubber CDRA/aminas y pausar ejercicio intenso."
            ),
            "protocol_id": "eva_dcs_hypoxia",
        })

    if m2["flammability_alert"] or m2["cabin_hypoxia"]:
        priorities.append({
            "severity": "critical" if (m2["estimated_inspired_po2_mmhg"] < 80.0 or telemetry.cabin_o2_percent >= 30.0) else "caution",
            "title": (
                f"Cabin Atmosphere Alert (P: {telemetry.cabin_pressure_psia} psia, O2: {telemetry.cabin_o2_percent}%)"
                if is_en
                else f"Alerta Atmosférica de Cabina (P: {telemetry.cabin_pressure_psia} psia, O2: {telemetry.cabin_o2_percent}%)"
            ),
            "detail": (
                (
                    f"O2 concentration >= 23.5% exceeds NASA-STD-3001 [V2 11040] flammability safety limit. "
                    if m2["flammability_alert"]
                    else ""
                )
                + (
                    f"Hypobaric/hypoxic inspired PIO2 ({m2['estimated_inspired_po2_mmhg']} mmHg, PAO2 {m2['estimated_alveolar_po2_mmhg']} mmHg)."
                    if m2["cabin_hypoxia"]
                    else f"Inspired PIO2: {m2['estimated_inspired_po2_mmhg']} mmHg."
                )
                if is_en
                else (
                    f"O2 >= 23.5% excede el límite de inflamabilidad NASA-STD-3001 [V2 11040]. "
                    if m2["flammability_alert"]
                    else ""
                )
                + (
                    f"PIO2 inspirada hipóxica ({m2['estimated_inspired_po2_mmhg']} mmHg, PAO2 {m2['estimated_alveolar_po2_mmhg']} mmHg)."
                    if m2["cabin_hypoxia"]
                    else f"PIO2 inspirada: {m2['estimated_inspired_po2_mmhg']} mmHg."
                )
            ),
            "action": (
                "Isolate ignition sources/free O2 leaks, verify ECLSS N2/O2 balance and apply closed-mask O2 if hypoxic."
                if is_en
                else "Aislar fuentes de ignición/fugas de O2, verificar mezcla N2/O2 ECLSS y usar mascarilla O2 si hay hipoxia."
            ),
            "protocol_id": "eva_dcs_hypoxia",
        })

    if telemetry.spo2_percent < 94.0:
        hyp_sev = "critical" if telemetry.spo2_percent < 90.0 else "caution"
        priorities.append({
            "severity": hyp_sev,
            "title": (
                f"Hypoxia / Desaturation ({telemetry.spo2_percent}% SpO2)"
                if is_en
                else f"Hipoxia / Desaturación ({telemetry.spo2_percent}% SpO2)"
            ),
            "detail": (
                f"SpO2 below clinical threshold (< 94%). Estimated alveolar PAO2: {m2['estimated_alveolar_po2_mmhg']} mmHg."
                if is_en
                else f"SpO2 por debajo del umbral clínico (< 94%). PAO2 alveolar estimada: {m2['estimated_alveolar_po2_mmhg']} mmHg."
            ),
            "action": (
                "Administer 100% supplemental O2, check cabin pressure/ppO2 and OGS supply; rule out depressurization or ABCDE emergency."
                if is_en
                else "Administrar O2 suplementario al 100%, verificar presión/ppO2 de cabina y suministro OGS; descartar despresurización o evento agudo ABCDE."
            ),
            "protocol_id": "abcde_0g_fast" if telemetry.spo2_percent < 90.0 else "eva_dcs_hypoxia",
        })

    if telemetry.ecg_arrhythmia_detected or bp_critical or hr_abnormal:
        priorities.append({
            "severity": "critical" if (telemetry.ecg_arrhythmia_detected or bp_critical) else "caution",
            "title": (
                f"Cardiovascular Alert (BP {int(telemetry.systolic_bp)}/{int(telemetry.diastolic_bp)}, HR {int(telemetry.heart_rate_bpm)} bpm)"
                if is_en
                else f"Alerta Cardiovascular (PA {int(telemetry.systolic_bp)}/{int(telemetry.diastolic_bp)}, FC {int(telemetry.heart_rate_bpm)} lpm)"
            ),
            "detail": (
                ("ECG arrhythmia detected. " if telemetry.ecg_arrhythmia_detected else "")
                + "Hemodynamic parameter outside nominal operational limits (SBP >= 150 or < 90, DBP >= 95, HR < 45 or > 110)."
                if is_en
                else ("Arritmia ECG detectada. " if telemetry.ecg_arrhythmia_detected else "")
                + "Parámetro hemodinámico fuera de límites operativos (PAS >= 150 o < 90, PAD >= 95, FC < 45 o > 110)."
            ),
            "action": (
                "Obtain 12-lead ECG, suspend LBNP/exercise, keep airway & AED ready under ABCDE 0g if unstable."
                if is_en
                else "Tomar ECG de 12 derivaciones, suspender LBNP/ejercicio y activar protocolo ABCDE 0g / Carril 2 si hay inestabilidad."
            ),
            "protocol_id": "abcde_0g_fast",
        })

    if m3["rad_status"] != "nominal" or m3["requires_serial_cbc_labs"]:
        has_shelter = is_hardware_available(env_id, "Storm Shelter")
        if is_en:
            action_parts = [
                "Relocate to Storm Shelter (45 g/cm²) and cancel EVA (ALARA principle)."
                if has_shelter
                else "Abort EVA immediately, use rover/terrain mass shielding (no 45 g/cm² Storm Shelter on this vehicle) and return to base habitat."
            ]
            if m3["requires_serial_cbc_labs"]:
                action_parts.append(
                    f"Draw baseline (4-6h) and 24/48/72h serial CBC (projected ALC: {m3['predicted_alc_cells_ul']} cells/µL)."
                )
        else:
            action_parts = [
                "Trasladarse a Storm Shelter (45 g/cm²) y cancelar EVA (principio ALARA)."
                if has_shelter
                else "Abortar EVA de inmediato, usar blindaje de masa del vehículo/terreno (sin Storm Shelter de 45 g/cm² en este vehículo) y retornar al módulo base."
            ]
            if m3["requires_serial_cbc_labs"]:
                action_parts.append(
                    f"Tomar BH basal (4–6 h) y seriada 24/48/72 h (ALC proyectado: {m3['predicted_alc_cells_ul']} cél/µL)."
                )
        priorities.append({
            "severity": "caution" if (m3["rad_status"] == "nominal" and m3["requires_serial_cbc_labs"]) else m3["rad_status"],
            "title": (
                f"Radiation / SPE Alert ({m3['effective_spe_bfo_mgyeq']} mGy-Eq BFO)"
                if is_en
                else f"Alerta Dosimétrica / SPE ({m3['effective_spe_bfo_mgyeq']} mGy-Eq a BFO)"
            ),
            "detail": (
                f"Remaining career effective budget: {m3['remaining_career_budget_msv']} mSv (of 600 mSv). Monitor prodromal emesis & viral reactivation."
                if is_en
                else f"Presupuesto efectivo restante de carrera: {m3['remaining_career_budget_msv']} mSv (de 600 mSv). Vigilar emesis prodrómica y reactivación viral."
            ),
            "action": " ".join(action_parts),
            "protocol_id": "spe_storm_shelter" if (has_shelter or m3["requires_serial_cbc_labs"]) else None,
        })

    # 2. Alteraciones glucémicas o inmuno-virales directas (incluso sin ansiedad)
    if telemetry.glucose_mg_dl < 70.0 or telemetry.glucose_mg_dl > 125.0:
        is_hypo = telemetry.glucose_mg_dl < 70.0
        priorities.append({
            "severity": "critical" if is_hypo else "caution",
            "title": (
                f"{'Severe Hypoglycemia' if is_hypo else 'Elevated Blood Glucose'} ({telemetry.glucose_mg_dl} mg/dL)"
                if is_en
                else f"{'Hipoglucemia Aguda' if is_hypo else 'Glucemia Elevada'} ({telemetry.glucose_mg_dl} mg/dL)"
            ),
            "detail": (
                "Can mimic acute stroke/neuro deficit. Do not give oral glucose if altered consciousness or dysphagia in 0g."
                if (is_en and is_hypo)
                else "Puede imitar déficit neurológico/ICTUS. En 0g prohibida la vía oral si hay alteración de conciencia o disfagia."
                if is_hypo
                else "Metabolic dysregulation above fasting threshold (> 125 mg/dL); recheck via PCBA i-STAT."
                if is_en
                else "Glucemia por encima de rango basal (> 125 mg/dL); confirmar con cartucho i-STAT en ayuno."
            ),
            "action": (
                "Give IV Dextrose (D50W/D10W) or Glucagon 1 mg IM if altered airway; oral 15 g gel ONLY if alert with intact swallow."
                if (is_en and is_hypo)
                else "Administrar Dextrosa IV (D50W/D10W) o Glucagón 1 mg IM si vía aérea comprometida; gel bucal 15 g SOLO si alerta y deglute."
                if is_hypo
                else "Repeat capillary i-STAT CHEM8+ and evaluate caloric/steroid/stress balance."
                if is_en
                else "Repetir glucemia i-STAT CHEM8+ y evaluar balance calórico/estrés metabólico."
            ),
            "protocol_id": "pcba_istat" if is_hardware_available(env_id, "PCBA (Abbott i-STAT)") else "abcde_0g_fast",
        })

    if telemetry.skin_rash_or_viral_symptoms and m3["rad_status"] == "nominal" and not m3["requires_serial_cbc_labs"]:
        priorities.append({
            "severity": "caution",
            "title": "Latent Viral Reactivation / Cutaneous Rash" if is_en else "Reactivación Viral / Exantema Cutáneo",
            "detail": (
                "Microgravity immune dysregulation marker (HSV/VZV/atopic flare) without elevated SPE dose."
                if is_en
                else "Signo compatible con desregulación inmune en microgravedad o reactivación viral sin evento SPE agudo."
            ),
            "action": (
                "Document lesions, evaluate topical/antiviral therapy and reinforce crew hygiene isolation."
                if is_en
                else "Documentar distribución dermatológica, valorar antiviral/tópico del botiquín y medidas de aislamiento de contacto."
            ),
            "protocol_id": None,
        })

    # 3. Neuroconductual / Ansiedad vs Imitadores Orgánicos
    if m5["organic_mimic_keys"] and (telemetry.anxiety_vas >= 6 or telemetry.gad2_score >= 3):
        only_env_mimic = (
            set(m5["organic_mimic_keys"]).issubset({"hypercapnia", "hypoxia"})
            and telemetry.spo2_percent >= 94.0
            and telemetry.glucose_mg_dl >= 70.0
        )
        priorities.append({
            "severity": "critical",
            "title": (
                "Organic Rule-Out: Physical Cause Driving Adrenergic Symptoms"
                if is_en
                else "Descarte Orgánico: Síntomas Adrenérgicos por Causa Física"
            ),
            "detail": (
                ("Before treating as primary anxiety, correct: " if is_en else "Antes de tratar como ansiedad primaria, corrige: ")
                + "; ".join(m5["organic_mimics_detected"])
            ),
            "action": (
                "Stabilize cabin ventilation/CDRA/O2 pressure first (sensor-confirmed; no i-STAT cartridge needed)."
                if (is_en and only_env_mimic)
                else "Corregir ventilación/CDRA/presión O2 de cabina (causa medida por sensor ambiental; no requiere gastar cartucho i-STAT)."
                if only_env_mimic
                else "Stabilize atmosphere, oxygenation and capillary glucose immediately."
                if is_en
                else "Estabilizar atmósfera/oxigenación/glucosa capilar de inmediato."
            ),
            "protocol_id": "eva_dcs_hypoxia" if only_env_mimic else ("pcba_istat" if is_hardware_available(env_id, "PCBA (Abbott i-STAT)") else None),
        })
    elif m5["recommend_01hz_breathing"]:
        priorities.append({
            "severity": "caution",
            "title": (
                "Positive Anxiety / Pre-Sleep Insomnia Screen"
                if is_en
                else "Tamizaje Positivo de Ansiedad / Insomnio Pre-Sueño"
            ),
            "detail": (
                f"GAD-2: {telemetry.gad2_score}/6, VAS: {telemetry.anxiety_vas}/10, HRV drop: {m5['hrv_drop_pct']}%. Organic mimics ruled out."
                if is_en
                else f"GAD-2: {telemetry.gad2_score}/6, VAS: {telemetry.anxiety_vas}/10, caída HRV: {m5['hrv_drop_pct']}%. Descarte orgánico limpio."
            ),
            "action": (
                "BLOCK blue light and caffeine. Start 5–10 min guided 0.1 Hz resonance breathing (4s inhale / 6s exhale) in dim amber light."
                if is_en
                else "BLOQUEAR luz azul y cafeína. Iniciar sesión de 5–10 min de Respiración Guiada a 0.1 Hz (4s inhalar / 6s exhalar) con luz tenue ámbar/roja."
            ),
            "protocol_id": "breathing_01hz",
        })

    if m5["pvt_status"] == "critical" or (m5["pvt_status"] != "nominal" and not m5["recommend_01hz_breathing"]):
        if is_en:
            pvt_action = (
                "Protect immediate sleep block (pre-sleep window: avoid blue light & caffeine). No-Go for EVA/critical ops."
                if m5["avoid_blue_light_and_caffeine"]
                else "460–480 nm blue light + strategic caffeine. If >= 355 ms persists: No-Go for EVA/critical ops and protect sleep block."
            )
        else:
            pvt_action = (
                "Proteger bloque de sueño inmediato (ventana pre-sueño: evitar luz azul y cafeína). No-Go para EVA/maniobras críticas."
                if m5["avoid_blue_light_and_caffeine"]
                else "Exposición a luz azul melanópica (460–480 nm) + cafeína estratégica. Si persiste >= 355 ms: No-Go para EVA/maniobras críticas y proteger bloque de sueño."
            )
        priorities.append({
            "severity": m5["pvt_status"],
            "title": (
                f"PVT-B Psychomotor Fatigue ({telemetry.pvt_mean_rt_ms} ms, {telemetry.pvt_lapses} lapses)"
                if is_en
                else f"Fatiga Psicomotora en PVT-B ({telemetry.pvt_mean_rt_ms} ms, {telemetry.pvt_lapses} lapsus)"
            ),
            "detail": (
                "Reduced reaction speed during operational shift."
                if is_en
                else "Velocidad de reacción disminuida en turno operativo."
            ),
            "action": pvt_action,
            "protocol_id": "abcde_0g_fast" if (telemetry.spo2_percent < 94.0 or telemetry.systolic_bp >= 150) else None,
        })

    if telemetry.audiometry_shift_4khz_db >= 15.0 or m5["noise_status"] != "nominal":
        priorities.append({
            "severity": "critical" if m5["noise_status"] == "critical" else "caution",
            "title": (
                f"Acoustic Risk / Hearing Shift (Noise {telemetry.cabin_noise_dba} dBA, 4 kHz +{telemetry.audiometry_shift_4khz_db} dB)"
                if is_en
                else f"Riesgo Acústico / Shift Auditivo (Ruido {telemetry.cabin_noise_dba} dBA, 4 kHz +{telemetry.audiometry_shift_4khz_db} dB)"
            ),
            "detail": (
                "Exceeds NASA-STD-3001 [V2 6078/6080] acoustic guidelines or shows >= 15 dB relative 4 kHz screening shift."
                if is_en
                else "Supera referencia acústica NASA-STD-3001 [V2 6078/6080] o muestra desplazamiento >= 15 dB en tamizaje relativo a 4 kHz."
            ),
            "action": (
                "Enforce hearing protection, allow 14h+ acoustic rest, and inspect noisy fans/pumps."
                if is_en
                else "Indicar protección auditiva doble, reposo acústico > 14h para diferenciar TTS vs PTS e inspeccionar ventiladores."
            ),
            "protocol_id": None,
        })

    if abs(profile.baseline_refraction_diopters) > 5.5:
        priorities.append({
            "severity": "caution",
            "title": "Refraction Outside OCHMO-STD-100.1A Limit" if is_en else "Refracción Fuera de Rango OCHMO-STD-100.1A",
            "detail": (
                f"Recorded baseline refraction ({profile.baseline_refraction_diopters:+.2f} D) exceeds ±5.50 D without documented waiver."
                if is_en
                else f"Refracción basal registrada ({profile.baseline_refraction_diopters:+.2f} D) excede ±5.50 D."
            ),
            "action": (
                "Verify spare crew eyewear and Aeromedical Board waiver in OCHMO-STD-100.1A."
                if is_en
                else "Verificar lentes de repuesto en órbita y registro de waiver médico OCHMO-STD-100.1A."
            ),
            "protocol_id": None,
        })

    # 4. SANS y Fluid Shift (adaptado a SWaP y candados LBNP)
    if m1["sans_risk"] != "nominal":
        if is_en:
            imaging_device = "OCT + POCUS ONSD" if is_hardware_available(env_id, "OCT") else "POCUS ONSD + Amsler Grid (no OCT on this vehicle)"
            if is_hardware_available(env_id, "LBNP") and m1["lbnp_safe"]:
                cm_text = f"Perform {imaging_device} and schedule LBNP session with continuous ECG/BP monitoring."
                proto = "lbnp_safety"
            elif is_hardware_available(env_id, "LBNP") and not m1["lbnp_safe"]:
                cm_text = (
                    f"Perform {imaging_device}. LBNP LOCKED by safety gate (rule out hypovolemia/DVT/arrhythmia/hypoglycemia first); "
                    "use Thigh Cuffs (30–50 mmHg), sodium < 3,000 mg/day and B-complex."
                )
                proto = "pocus_dvt" if telemetry.pocus_dvt_suspicion else "thigh_cuff_sans"
            else:
                cm_text = (
                    f"Perform {imaging_device} and apply Thigh Cuffs (30–50 mmHg, sequesters 500–1000 mL) "
                    "+ sodium < 3,000 mg/day; return to base/habitat if progressing."
                )
                proto = "thigh_cuff_sans"
        else:
            imaging_device = "OCT + POCUS ONSD" if is_hardware_available(env_id, "OCT") else "POCUS ONSD + Rejilla de Amsler (sin OCT en este vehículo)"
            if is_hardware_available(env_id, "LBNP") and m1["lbnp_safe"]:
                cm_text = f"Realizar {imaging_device} y programar sesión de LBNP con monitoreo ECG/Bauma continuo."
                proto = "lbnp_safety"
            elif is_hardware_available(env_id, "LBNP") and not m1["lbnp_safe"]:
                cm_text = (
                    f"Realizar {imaging_device}. LBNP BLOQUEADO por candado de seguridad "
                    "(descartar hipovolemia/TVP/arritmia/hipoglucemia primero); usar Thigh Cuffs (30-50 mmHg), "
                    "restringir sodio < 3,000 mg/día y mantener Complejo B."
                )
                proto = "pocus_dvt" if telemetry.pocus_dvt_suspicion else "thigh_cuff_sans"
            else:
                cm_text = (
                    f"Realizar {imaging_device} y usar Thigh Cuffs (30-50 mmHg, secuestra 500-1000 mL en piernas) "
                    "+ sodio < 3,000 mg/día; retornar a base/módulo si progresa."
                )
                proto = "thigh_cuff_sans"

        priorities.append({
            "severity": m1["sans_risk"],
            "title": (
                f"SANS Neuro-Ocular Surveillance (ΔONSD: +{m1['onsd_delta_mm']} mm, ΔTRT250: {m1['oct_trt250_delta_um']} µm)"
                if is_en
                else f"Vigilancia Neuro-Ocular SANS (ΔONSD: +{m1['onsd_delta_mm']} mm, ΔTRT250: {m1['oct_trt250_delta_um']} µm)"
            ),
            "detail": (
                f"Lost standing hydrostatic gradient: {m1['cephalad_pressure_shift_mmhg']} mmHg."
                if is_en
                else f"Gradiente ortostático perdido respecto a 1g: {m1['cephalad_pressure_shift_mmhg']} mmHg."
            ),
            "action": cm_text,
            "protocol_id": proto,
        })
    elif telemetry.pocus_dvt_suspicion:
        priorities.append({
            "severity": "critical",
            "title": (
                "Suspected Deep Vein Thrombosis (DVT) — LBNP LOCKED"
                if is_en
                else "Sospecha de Trombosis Venosa Profunda (TVP) — LBNP BLOQUEADO"
            ),
            "detail": (
                "Positive venous POCUS suspicion with nominal SANS metrics."
                if is_en
                else "Signo positivo o sospecha POCUS venosa yugular/profunda con SANS aún nominal."
            ),
            "action": (
                "LBNP strictly contraindicated. Perform immediate compressive POCUS DVT scan and consult Flight Surgeon."
                if is_en
                else "LBNP estrictamente contraindicado. Realizar POCUS compresivo TVP inmediato, valorar anticoagulación y consultar Flight Surgeon."
            ),
            "protocol_id": "pocus_dvt",
        })

    # 5. Preparación Ortostática Pre-Descenso
    if telemetry.is_planetary_descent_soon:
        severe_sans = (
            m1["sans_risk"] == "critical"
            or telemetry.onsd_measured_mm >= 5.8
            or telemetry.amsler_distortions > 0
        )
        high_bp_contra = telemetry.systolic_bp >= 150.0
        fluid_contra = severe_sans or high_bp_contra
        has_oig = is_hardware_available(env_id, "OIG / Kentavr")
        suit_note_en = "don OIG / Kentavr suit" if has_oig else "use crew compression garment / return via base lander"
        suit_note_es = "colocar prenda OIG / Kentavr" if has_oig else "usar prenda compresiva disponible / traslado a módulo de descenso"
        if severe_sans and high_bp_contra:
            contra_detail_en = "Active severe SANS and SBP ≥ 150 mmHg: relative contraindication for aggressive acute NaCl loading."
            contra_detail_es = "SANS severo activo y PAS ≥ 150 mmHg: contraindicación relativa para sobrecarga aguda de NaCl."
        elif severe_sans:
            contra_detail_en = "Active severe SANS: relative contraindication for aggressive acute NaCl loading (may worsen neuro-ocular edema)."
            contra_detail_es = "SANS severo activo: contraindicación relativa para sobrecarga aguda de NaCl (puede agravar edema neuro-ocular)."
        else:
            contra_detail_en = f"Elevated SBP ({telemetry.systolic_bp} mmHg ≥ 150 mmHg): relative contraindication for aggressive acute NaCl loading."
            contra_detail_es = f"PAS elevada ({telemetry.systolic_bp} mmHg ≥ 150 mmHg): contraindicación relativa para sobrecarga aguda de NaCl."

        priorities.append({
            "severity": "critical" if severe_sans else "caution",
            "title": (
                f"Pre-Descent Preparation (Plasma Vol: {m1['plasma_volume_change_pct']}%)"
                if is_en
                else f"Preparación Pre-Descenso (Volumen plasmático: {m1['plasma_volume_change_pct']}%)"
            ),
            "detail": (
                contra_detail_en
                if (is_en and fluid_contra)
                else contra_detail_es
                if fluid_contra
                else "High risk of orthostatic intolerance and syncope on gravity re-entry."
                if is_en
                else "Riesgo alto de intolerancia ortostática y síncope al reentrar a campo gravitatorio."
            ),
            "action": (
                f"DO NOT run aggressive NaCl bolus without Flight Surgeon clearance; control BP/ONSD under monitoring and {suit_note_en}."
                if (is_en and fluid_contra)
                else f"NO ejecutar carga agresiva de NaCl sin autorización del Flight Surgeon; vigilar PA/ONSD/PIO y {suit_note_es}."
                if fluid_contra
                else f"Execute Fluid Loading (1.0 L + 8-9 NaCl 1g tabs over 60-90 min) and {suit_note_en}."
                if is_en
                else f"Ejecutar Fluid Loading (1.0 L + 8-9 tabletas NaCl 1g en 60-90 min) y {suit_note_es}."
            ),
            "protocol_id": "fluid_loading_reentry",
        })

    # 6. Hueso y Riñón (adaptado a SWaP)
    if m4["bone_renal_status"] != "nominal":
        ex_dev = (
            "ARED + T2"
            if is_hardware_available(env_id, "ARED")
            else ("Zero T2 / resistive bands (no ARED on this vehicle)" if is_en else "Zero T2 / bandas resistivas (sin ARED en este vehículo)")
        )
        if telemetry.flank_pain:
            action_br = (
                "Protocol analgesia, tamsulosin, renal POCUS (rule out hydronephrosis) and PCBA i-STAT Cr/K+ before potassium citrate."
                if is_en
                else "Analgesia de protocolo, tamsulosina, POCUS renal (descartar hidronefrosis) e i-STAT Cr/K+ antes de valorar citrato."
            )
        else:
            action_br = (
                f"Increase fluids >= 2.5 L/day, review potassium citrate / alendronate 70 mg/wk and maintain load on {ex_dev}."
                if is_en
                else f"Aumentar hidratación a >= 2.5 L/día, valorar citrato de potasio / alendronato 70 mg/sem y cumplir carga en {ex_dev}."
            )

        priorities.append({
            "severity": m4["bone_renal_status"],
            "title": (
                f"Bone–Renal Axis (BMD: {m4['cumulative_bmd_loss_pct']}%, Renal Sat: {m4['renal_supersaturation_index']})"
                if is_en
                else f"Eje Hueso–Riñón (DMO: {m4['cumulative_bmd_loss_pct']}%, Sat. Renal: {m4['renal_supersaturation_index']})"
            ),
            "detail": (
                f"Current rate: {m4['monthly_bmd_loss_pct']}%/mo. Urine output: {telemetry.urine_output_liters} L/day."
                if is_en
                else f"Pérdida actual: {m4['monthly_bmd_loss_pct']}%/mes. Diuresis: {telemetry.urine_output_liters} L/día."
            ),
            "action": action_br,
            "protocol_id": "renal_stone_pocus",
        })

    if not priorities:
        priorities.append({
            "severity": "nominal",
            "title": "Nominal Physiological & Cabin State" if is_en else "Estado Fisiológico y Ambiental Nominal",
            "detail": (
                "All parameters within NASA-STD-3001 thresholds and personal baseline."
                if is_en
                else "Todos los parámetros dentro de umbrales NASA-STD-3001 y línea base personal."
            ),
            "action": (
                "Continue daily routine: hydration >= 2.5 L, scheduled exercise block and 60s check-in."
                if is_en
                else "Continuar rutina diaria: hidratación >= 2.5 L, sesión de ejercicio programada y check-in de 60 s."
            ),
            "protocol_id": None,
        })

    global_status = worst_status(*zones.values(), *[p["severity"] for p in priorities])

    return {
        "environment": env,
        "global_status": global_status,
        "zones": zones,
        "models": {
            "hydrostatics_and_fluids": m1,
            "cabin_co2_and_alveolar": m2,
            "radiation_and_lymphocytes": m3,
            "bone_and_renal": m4,
            "neuro_and_anxiety": m5,
        },
        "priorities": priorities,
    }


def step_telemetry_dt(
    telemetry: TelemetryInput,
    dt_minutes: float = 5.0,
    profile: Optional[BaselineProfile] = None,
) -> TelemetryInput:
    """
    Integra un paso temporal discreto (dt_minutes) sobre las variables dinámicas
    de cabina y fisiología acoplada usando el mismo balance de masa y basales del perfil.
    """
    dt_clamped = max(0.0, min(1440.0, float(dt_minutes)))
    if dt_clamped == 0.0:
        return telemetry
    dt_h = dt_clamped / 60.0
    data = telemetry.model_dump()
    env = get_environment(telemetry.environment_id)

    # 1. Conservación de ppCO2 acoplada al volumen y capacidad CDRA del vehículo
    metabolic_gen_mmhg_h, removal_mmhg_h = _cdra_rates_mmhg_h(env, telemetry)
    d_ppco2_dt = max(-0.5, metabolic_gen_mmhg_h - removal_mmhg_h)
    next_ppco2 = telemetry.cabin_ppco2_mmhg + d_ppco2_dt * dt_h
    data["cabin_ppco2_mmhg"] = round(max(0.6, min(8.5, next_ppco2)), 2)

    # 2. Respuesta fisiológica acoplada usando línea base personal real
    hr_base = profile.hr_baseline_bpm if profile else 64.0
    onsd_base = profile.onsd_baseline_mm if profile else 4.2
    co2_excess = max(0.0, data["cabin_ppco2_mmhg"] - 3.0)
    target_hr = hr_base + co2_excess * 5.5 + (6.0 if telemetry.water_intake_liters < 2.0 else 0.0)
    data["heart_rate_bpm"] = round(telemetry.heart_rate_bpm + (target_hr - telemetry.heart_rate_bpm) * min(1.0, 0.25 * dt_h), 1)

    target_onsd = onsd_base + co2_excess * 0.14
    if env["g_ratio"] < 0.16:
        target_onsd = max(telemetry.onsd_measured_mm, target_onsd)
    data["onsd_measured_mm"] = round(telemetry.onsd_measured_mm + (target_onsd - telemetry.onsd_measured_mm) * min(1.0, 0.2 * dt_h), 2)

    if telemetry.spe_event_dose_mgyeq > 0.0:
        data["hours_since_spe"] = round(telemetry.hours_since_spe + dt_h, 2)

    return TelemetryInput(**data)
