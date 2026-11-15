"""
API Backend Offline-First (FastAPI) — EIMO (Engine for In-Flight Medical Operations).
Expone la matriz multi-entorno SWaP, los escenarios de simulación para jueces,
el motor biofísico acoplado, las guías paso a paso (protocolos.json) y el
empaquetado asíncrono Store-and-Forward de Carril 2.
"""

from contextlib import asynccontextmanager
from datetime import date, timedelta
from functools import lru_cache
import json
from pathlib import Path
from typing import Dict, Any, Literal
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from swap_matrix import ENVIRONMENTS, get_environment
from physics_engine import (
    BaselineProfile,
    TelemetryInput,
    evaluate_full_mission_state,
    step_telemetry_dt,
    resolve_age,
    resolve_mission_day,
)
from database import (
    init_db,
    save_baseline_profile,
    load_baseline_profile,
    log_evaluation,
    get_recent_evaluations,
    enqueue_store_and_forward,
    update_store_and_forward_packet,
    get_store_and_forward_queue,
    sync_store_and_forward_queue,
    sync_single_packet,
    clear_evaluation_logs,
    clear_transmitted_queue,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    if load_baseline_profile() is None:
        save_baseline_profile(BaselineProfile().model_dump())
    yield


app = FastAPI(
    title="EIMO Astronaut Health CDSS API",
    description="Motor Clínico-Biofísico Autónomo (NASA Space Apps Challenge 2026)",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROTOCOLS_PATH = Path(__file__).parent / "protocolos.json"


@lru_cache(maxsize=1)
def _load_protocols_raw() -> Dict[str, Any]:
    with open(PROTOCOLS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _localize_env(env: Dict[str, Any], lang: str) -> Dict[str, Any]:
    out = dict(env)
    if lang == "en":
        out["name"] = env.get("name_en", env["name"])
        out["rtt_label"] = env.get("rtt_label_en", env["rtt_label"])
        out["radiation_zone"] = env.get("radiation_zone_en", env["radiation_zone"])
    return out


# Escenarios preconfigurados para el switch [Modo Simulador Demo]
DEMO_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "nominal": {
        "name": "Día Nominal en Misión",
        "name_en": "Nominal Mission Day",
        "description": "Parámetros ambientales y signos vitales dentro de rangos NASA-STD-3001.",
        "description_en": "Cabin environment and crew vitals within NASA-STD-3001 limits.",
        "telemetry": TelemetryInput().model_dump(),
    },
    "co2_scrubber_failure": {
        "name": "Fallo Parcial de Scrubber CO2 (CDRA)",
        "name_en": "Partial CO2 Scrubber Failure (CDRA)",
        "description": "Acumulación de ppCO2 (> 3.0 mmHg) sin convección en 0g -> cefalea, vasodilatación (SANS) y caída en PVT.",
        "description_en": "Cabin ppCO2 buildup (> 3.0 mmHg) without 0g convection -> headache, cerebral vasodilation (worsens SANS) and PVT slowing.",
        "telemetry": TelemetryInput(
            cabin_ppco2_mmhg=4.4,
            cdra_scrubber_efficiency=0.20,
            pvt_mean_rt_ms=345.0,
            pvt_lapses=1,
            onsd_measured_mm=4.7,
            anxiety_vas=7,
            gad2_score=3,
        ).model_dump(),
    },
    "solar_storm_spe": {
        "name": "Tormenta Solar Aguda (SPE) en Tránsito",
        "name_en": "Acute Solar Particle Event (SPE) in Transit",
        "description": "Evento de protones solares en espacio profundo: supera umbral de 250 mGy-Eq a BFO y activa protocolo de BH/linfocitos.",
        "description_en": "Deep-space solar protons exceed 250 mGy-Eq BFO limit; triggers storm shelter & serial CBC lymphocyte protocol.",
        "telemetry": TelemetryInput(
            environment_id="transit",
            shielding_posture="nominal",
            spe_event_dose_mgyeq=380.0,
            hours_since_spe=24.0,
            skin_rash_or_viral_symptoms=True,
        ).model_dump(),
    },
    "pre_sleep_anxiety": {
        "name": "Insomnio por Ansiedad Pre-Sueño",
        "name_en": "Pre-Sleep Anxiety & Insomnia",
        "description": "Descarte orgánico limpio + GAD-2 positivo + caída de HRV en ventana nocturna -> activa respiración vagal a 0.1 Hz.",
        "description_en": "Organic mimics clean + positive GAD-2 + HRV drop in pre-sleep window -> triggers 0.1 Hz vagal breathing.",
        "telemetry": TelemetryInput(
            is_pre_sleep_window=True,
            sleep_hours=5.1,
            sleep_onset_latency_min=48.0,
            pvt_mean_rt_ms=362.0,
            pvt_lapses=2,
            heart_rate_bpm=82.0,
            hrv_rmssd_ms=28.0,
            anxiety_vas=8,
            gad2_score=4,
        ).model_dump(),
    },
    "mars_descent_bone_renal": {
        "name": "Descenso a Marte (0.38g) + Riesgo Renal",
        "name_en": "Mars Descent (0.38g) + Renal Stone Risk",
        "description": "Baja adherencia a ejercicio + deshidratación previo a gravedad marciana -> alerta de Fluid Loading + OIG y riesgo de litiasis.",
        "description_en": "Low exercise adherence + dehydration ahead of Mars gravity re-entry -> Fluid Loading + OIG alert & nephrolithiasis risk.",
        "telemetry": TelemetryInput(
            environment_id="mars_base",
            is_planetary_descent_soon=True,
            exercise_adherence_ratio=0.35,
            water_intake_liters=1.3,
            urine_output_liters=0.9,
            urine_specific_gravity=1.026,
            ionized_calcium_mmol_l=1.36,
        ).model_dump(),
    },
    "sans_dvt_lock": {
        "name": "SANS Severo + Sospecha TVP (Bloqueo LBNP)",
        "name_en": "Severe SANS + DVT Suspicion (LBNP Lockout)",
        "description": "Edema ocular (ONSD 5.9 mm, ΔTRT250 +62 um, IOP 23 mmHg, Amsler alterado) + sospecha de coágulo -> bloquea LBNP y exige POCUS TVP + Thigh Cuffs.",
        "description_en": "Severe ocular edema (ONSD 5.9 mm, ΔTRT250 +62 um, IOP 23 mmHg, positive Amsler) + venous clot suspicion -> locks LBNP, requires DVT POCUS + Thigh Cuffs.",
        "telemetry": TelemetryInput(
            environment_id="iss",
            onsd_measured_mm=5.9,
            oct_trt250_delta_um=62.0,
            iop_mmhg=23.0,
            amsler_distortions=2,
            near_acuity="20/40",
            pocus_dvt_suspicion=True,
        ).model_dump(),
    },
    "acute_renal_colic": {
        "name": "Patología: Cólico Nefrítico / Litiasis Renal",
        "name_en": "Pathology: Renal Colic / Nephrolithiasis",
        "description": "Dolor en flanco + hipercalcemia ionizada (1.46 mmol/L) + oliguria concentrada -> dispara protocolo renal_stone_pocus y PCBA.",
        "description_en": "Flank pain + ionized hypercalcemia (1.46 mmol/L) + concentrated oliguria -> triggers renal POCUS & PCBA electrolyte protocol.",
        "telemetry": TelemetryInput(
            environment_id="iss",
            flank_pain=True,
            ionized_calcium_mmol_l=1.46,
            water_intake_liters=1.2,
            urine_output_liters=0.7,
            urine_specific_gravity=1.028,
            heart_rate_bpm=98.0,
        ).model_dump(),
    },
    "organic_mimic_hypoglycemia": {
        "name": "Alteración Metabólica: Hipoglucemia + Hipoxia (Imitador)",
        "name_en": "Metabolic Imitator: Hypoglycemia + Hypoxia",
        "description": "Glucosa 58 mg/dL + SpO2 91% con ansiedad alta (VAS 8, GAD-2 4) -> el motor bloquea diagnóstico psicológico y prioriza corrección física.",
        "description_en": "Glucose 58 mg/dL + SpO2 91% with high anxiety score -> engine blocks primary anxiety diagnosis and prioritizes physical correction.",
        "telemetry": TelemetryInput(
            environment_id="rover",
            glucose_mg_dl=58.0,
            spo2_percent=91.0,
            heart_rate_bpm=108.0,
            hrv_rmssd_ms=26.0,
            anxiety_vas=8,
            gad2_score=4,
        ).model_dump(),
    },
    "acute_emergency_stroke_preview": {
        "name": "Emergencia Aguda (Carril 2): Sospecha de ICTUS en Tránsito",
        "name_en": "Acute Emergency (Lane 2): Suspected Stroke in Transit",
        "description": "Simula un evento agudo crítico (PAS 152, SpO2 91%, alteración neurológica) y habilita vista previa de Carril 2 (ABCDE 0g + FAST + Store-and-Forward).",
        "description_en": "Simulates critical acute event (SBP 152, SpO2 91%, neuro deficit) and opens Lane 2 (ABCDE 0g + FAST + Store-and-Forward).",
        "open_emergency_modal": True,
        "telemetry": TelemetryInput(
            environment_id="transit",
            systolic_bp=152.0,
            diastolic_bp=94.0,
            heart_rate_bpm=92.0,
            spo2_percent=91.0,
            glucose_mg_dl=94.0,
            pvt_mean_rt_ms=410.0,
            pvt_lapses=3,
        ).model_dump(),
    },
}


class EmergencyPacketRequest(BaseModel):
    packet_id: int | None = None
    elapsed_seconds: int = Field(default=0, ge=0, le=86400)
    environment_id: Literal["iss", "transit", "rover", "mars_base"] = "transit"
    red_flag_type: str = Field(default="Evaluación Aguda ABCDE (En curso)", max_length=140)
    fast_face_asymmetry: bool = False
    fast_arm_drift: bool = False
    fast_speech_slurred: bool = False
    gcs_score: int | None = Field(default=None, ge=3, le=15)
    symptom_onset_time: str = Field(default="", max_length=64)
    capillary_glucose_mg_dl: float | None = Field(default=None, ge=15.0, le=800.0)
    systolic_bp: float | None = Field(default=None, ge=40.0, le=260.0)
    diastolic_bp: float | None = Field(default=None, ge=20.0, le=160.0)
    heart_rate_bpm: float | None = Field(default=None, ge=20.0, le=240.0)
    spo2_percent: float | None = Field(default=None, ge=50.0, le=100.0)
    notes: str = Field(default="", max_length=1000)


@app.get("/api/environments")
def list_environments(lang: str = Query("es")) -> Dict[str, Any]:
    return {
        "environments": {
            k: _localize_env(v, lang) for k, v in ENVIRONMENTS.items()
        }
    }


@app.get("/api/protocols")
def list_protocols(lang: str = Query("es")) -> Dict[str, Any]:
    raw = _load_protocols_raw()
    if lang != "en":
        return {"protocols": raw}
    localized: Dict[str, Any] = {}
    for pid, p in raw.items():
        localized[pid] = {
            **p,
            "title": p.get("title_en", p["title"]),
            "clinical_rationale": p.get("clinical_rationale_en", p["clinical_rationale"]),
            "risk_domain": p.get("risk_domain_en", p["risk_domain"]),
            "steps": p.get("steps_en", p["steps"]),
            "decision_thresholds": p.get("decision_thresholds_en", p["decision_thresholds"]),
        }
    return {"protocols": localized}


@app.get("/api/scenarios")
def list_scenarios(lang: str = Query("es")) -> Dict[str, Any]:
    if lang != "en":
        return {"scenarios": DEMO_SCENARIOS}
    localized = {}
    for sid, sc in DEMO_SCENARIOS.items():
        localized[sid] = {
            **sc,
            "name": sc.get("name_en", sc["name"]),
            "description": sc.get("description_en", sc["description"]),
        }
    return {"scenarios": localized}


@app.get("/api/baseline")
def get_baseline() -> Dict[str, Any]:
    saved = load_baseline_profile()
    profile = BaselineProfile(**saved) if saved else BaselineProfile()
    data = profile.model_dump()
    if not data.get("launch_date"):
        data["launch_date"] = (date.today() - timedelta(days=max(0, profile.mission_day))).isoformat()
    p_obj = BaselineProfile(**data)
    data["mission_day"] = resolve_mission_day(p_obj)
    data["age"] = resolve_age(p_obj)
    return {"baseline": data}


@app.post("/api/baseline")
def update_baseline(profile: BaselineProfile) -> Dict[str, Any]:
    data = profile.model_dump()
    if data.get("auto_advance_mission_day", True) and not data.get("launch_date"):
        data["launch_date"] = (date.today() - timedelta(days=max(0, profile.mission_day))).isoformat()
    p_obj = BaselineProfile(**data)
    data["mission_day"] = resolve_mission_day(p_obj)
    data["age"] = resolve_age(p_obj)
    saved = save_baseline_profile(data)
    return {"baseline": saved}


@app.post("/api/evaluate")
def evaluate_telemetry(
    telemetry: TelemetryInput,
    lang: str = Query("es"),
    persist: bool = Query(True),
) -> Dict[str, Any]:
    saved_profile = load_baseline_profile()
    profile = BaselineProfile(**saved_profile) if saved_profile else BaselineProfile()
    result = evaluate_full_mission_state(profile, telemetry, lang=lang)
    result["environment"] = _localize_env(result["environment"], lang)
    if persist:
        log_id = log_evaluation(
            telemetry.environment_id,
            result["global_status"],
            telemetry.model_dump(),
            result,
        )
        result["log_id"] = log_id
    return result


class StepRequest(BaseModel):
    telemetry: TelemetryInput
    dt_minutes: float = Field(default=5.0, ge=0.0, le=1440.0)
    persist: bool = False


@app.post("/api/step")
def step_simulation(req: StepRequest, lang: str = Query("es")) -> Dict[str, Any]:
    saved_profile = load_baseline_profile()
    profile = BaselineProfile(**saved_profile) if saved_profile else BaselineProfile()
    next_telemetry = step_telemetry_dt(req.telemetry, req.dt_minutes, profile=profile)
    result = evaluate_full_mission_state(profile, next_telemetry, lang=lang)
    result["environment"] = _localize_env(result["environment"], lang)
    if req.persist:
        result["log_id"] = log_evaluation(
            next_telemetry.environment_id,
            result["global_status"],
            next_telemetry.model_dump(),
            result,
        )
    result["telemetry"] = next_telemetry.model_dump()
    return result


@app.get("/api/history")
def get_history() -> Dict[str, Any]:
    return {"history": get_recent_evaluations(15)}


@app.delete("/api/history")
def delete_history() -> Dict[str, Any]:
    cleared = clear_evaluation_logs()
    return {"cleared": cleared, "history": []}


@app.get("/api/emergency-queue")
def list_emergency_queue() -> Dict[str, Any]:
    return {"queue": get_store_and_forward_queue(20)}


@app.post("/api/emergency-queue/sync")
def sync_emergency_queue() -> Dict[str, Any]:
    synced_count = sync_store_and_forward_queue()
    return {"synced_count": synced_count, "queue": get_store_and_forward_queue(20)}


@app.post("/api/emergency-queue/{packet_id}/sync")
def sync_emergency_packet(packet_id: int) -> Dict[str, Any]:
    synced_count = sync_single_packet(packet_id)
    return {"synced_count": synced_count, "queue": get_store_and_forward_queue(20)}


@app.delete("/api/emergency-queue/transmitted")
def delete_transmitted_queue() -> Dict[str, Any]:
    cleared = clear_transmitted_queue()
    return {"cleared": cleared, "queue": get_store_and_forward_queue(20)}


@app.post("/api/emergency-store-forward")
def trigger_emergency_store_forward(
    req: EmergencyPacketRequest,
    lang: str = Query("es"),
) -> Dict[str, Any]:
    raw_env = get_environment(req.environment_id)
    env = _localize_env(raw_env, lang)
    saved_profile = load_baseline_profile() or BaselineProfile().model_dump()
    payload = {
        "crew_member": saved_profile.get("callsign"),
        "blood_type": saved_profile.get("blood_type"),
        "allergies": saved_profile.get("allergies"),
        "environment": env["name"],
        "red_flag_type": req.red_flag_type,
        "fast_scale": {
            "face_asymmetry": req.fast_face_asymmetry,
            "arm_drift": req.fast_arm_drift,
            "speech_slurred": req.fast_speech_slurred,
            "onset_time": req.symptom_onset_time,
        },
        "gcs_score": req.gcs_score,
        "hypoglycemia_ruled_out": (
            req.capillary_glucose_mg_dl >= 70.0
            if req.capillary_glucose_mg_dl is not None
            else None
        ),
        "vitals": {
            "glucose_mg_dl": req.capillary_glucose_mg_dl,
            "bp": (
                f"{req.systolic_bp}/{req.diastolic_bp} mmHg"
                if req.systolic_bp is not None and req.diastolic_bp is not None
                else None
            ),
            "hr_bpm": req.heart_rate_bpm,
            "spo2_percent": req.spo2_percent,
        },
        "elapsed_seconds": req.elapsed_seconds,
        "notes": req.notes,
    }
    packet = None
    if req.packet_id is not None:
        packet = update_store_and_forward_packet(
            packet_id=req.packet_id,
            event_type=req.red_flag_type,
            rtt_seconds=env["rtt_seconds"],
            payload=payload,
        )
    if packet is None:
        packet = enqueue_store_and_forward(
            event_type=req.red_flag_type,
            rtt_seconds=env["rtt_seconds"],
            payload=payload,
        )
    return {"packet": packet, "environment": env}
