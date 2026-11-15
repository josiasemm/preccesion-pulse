"""
Pruebas de Estrés Físicas, Clínicas y Contratos API — EIMO Astronaut Health CDSS.
Usa SQLite temporal (tmp_path + monkeypatch) para no ensuciar la BD operativa.
"""

import database
from physics_engine import (
    BaselineProfile,
    TelemetryInput,
    evaluate_full_mission_state,
    step_telemetry_dt,
)


def test_nominal_state_is_green():
    profile = BaselineProfile()
    telemetry = TelemetryInput()
    res = evaluate_full_mission_state(profile, telemetry)
    assert res["global_status"] == "nominal"
    assert res["models"]["hydrostatics_and_fluids"]["delta_p_current_mmhg"] == 0.0
    assert res["models"]["hydrostatics_and_fluids"]["cephalad_pressure_shift_mmhg"] > 25.0


def test_partial_gravity_hydrostatics_and_bmd_asymptotic_cap():
    profile = BaselineProfile(mission_day=10000)
    tel_mars = TelemetryInput(environment_id="mars_base", exercise_adherence_ratio=0.0)
    res = evaluate_full_mission_state(profile, tel_mars)
    m1 = res["models"]["hydrostatics_and_fluids"]
    m4 = res["models"]["bone_and_renal"]
    assert 0.0 < m1["delta_p_current_mmhg"] < m1["delta_p_earth_mmhg"]
    # Meseta asintótica fisiológica: nunca supera -35% ni -100%
    assert -35.0 <= m4["cumulative_bmd_loss_pct"] < 0.0


def test_cdra_removal_does_not_scale_magically_with_crew_count():
    profile = BaselineProfile()
    t4 = TelemetryInput(crew_count=4, cabin_ppco2_mmhg=2.1, cdra_scrubber_efficiency=0.95)
    t10 = TelemetryInput(crew_count=10, cabin_ppco2_mmhg=2.1, cdra_scrubber_efficiency=0.95)
    r4 = evaluate_full_mission_state(profile, t4)["models"]["cabin_co2_and_alveolar"]
    r10 = evaluate_full_mission_state(profile, t10)["models"]["cabin_co2_and_alveolar"]
    assert r10["d_ppco2_dt_mmhg_h"] > r4["d_ppco2_dt_mmhg_h"]


def test_hypercapnia_blocks_primary_anxiety_diagnosis():
    profile = BaselineProfile()
    telemetry = TelemetryInput(
        cabin_ppco2_mmhg=4.5,
        anxiety_vas=8,
        gad2_score=5,
        hrv_rmssd_ms=25.0,
        is_pre_sleep_window=True,
    )
    res = evaluate_full_mission_state(profile, telemetry)
    m5 = res["models"]["neuro_and_anxiety"]
    assert "hypercapnia" in m5["organic_mimic_keys"]
    assert m5["anxiety_screen_positive"] is False
    assert m5["recommend_01hz_breathing"] is False


def test_clean_pre_sleep_anxiety_activates_01hz_breathing():
    profile = BaselineProfile()
    telemetry = TelemetryInput(
        cabin_ppco2_mmhg=2.0,
        spo2_percent=98.0,
        glucose_mg_dl=90.0,
        is_pre_sleep_window=True,
        anxiety_vas=8,
        gad2_score=4,
        hrv_rmssd_ms=26.0,
        sleep_onset_latency_min=45.0,
    )
    res = evaluate_full_mission_state(profile, telemetry)
    m5 = res["models"]["neuro_and_anxiety"]
    assert m5["anxiety_screen_positive"] is True
    assert m5["recommend_01hz_breathing"] is True
    assert m5["avoid_blue_light_and_caffeine"] is True


def test_storm_shelter_attenuates_spe_and_separates_msv_vs_mgyeq():
    profile = BaselineProfile(prior_career_rad_msv=20.0, mission_day=10)
    tel_nom = TelemetryInput(
        environment_id="transit",
        shielding_posture="nominal",
        spe_event_dose_mgyeq=600.0,
        hours_since_spe=24.0,
    )
    tel_shl = TelemetryInput(
        environment_id="transit",
        shielding_posture="storm_shelter",
        spe_event_dose_mgyeq=600.0,
        hours_since_spe=24.0,
    )
    tel_rover = TelemetryInput(
        environment_id="rover",
        shielding_posture="nominal",
        spe_event_dose_mgyeq=300.0,
    )
    r_nom = evaluate_full_mission_state(profile, tel_nom)["models"]["radiation_and_lymphocytes"]
    r_shl = evaluate_full_mission_state(profile, tel_shl)["models"]["radiation_and_lymphocytes"]
    r_rov = evaluate_full_mission_state(profile, tel_rover)["models"]["radiation_and_lymphocytes"]

    assert r_nom["effective_spe_bfo_mgyeq"] == 600.0
    assert r_rov["effective_spe_bfo_mgyeq"] == 300.0
    assert r_nom["total_career_dose_msv"] < 100.0  # No suma BFO mGy-Eq directo a mSv
    assert r_nom["requires_serial_cbc_labs"] is True
    assert r_nom["predicted_alc_cells_ul"] < profile.alc_baseline_cells_ul
    assert r_shl["effective_spe_bfo_mgyeq"] < 100.0
    assert r_shl["requires_serial_cbc_labs"] is False


def test_lbnp_locks_unified_thresholds_and_rover_swap():
    profile = BaselineProfile(amb_waiver_orthostatic_or_arrhythmia=False)
    # Densidad urinaria >= 1.020 debe bloquear LBNP conforme a protocolos.json
    tel_sg = TelemetryInput(urine_specific_gravity=1.021)
    assert evaluate_full_mission_state(profile, tel_sg)["models"]["hydrostatics_and_fluids"]["lbnp_safe"] is False

    # Rover con SANS severo (ΔTRT250 >= 55) + TVP -> sin OCT, bloquea LBNP
    tel_rover = TelemetryInput(
        environment_id="rover",
        onsd_measured_mm=5.1,
        oct_trt250_delta_um=60.0,
        amsler_distortions=2,
        pocus_dvt_suspicion=True,
    )
    res = evaluate_full_mission_state(profile, tel_rover)
    m1 = res["models"]["hydrostatics_and_fluids"]
    assert m1["sans_risk"] == "critical"
    assert m1["lbnp_safe"] is False
    assert m1["lbnp_locks"]["dvt_suspicion"] is True
    sans_priorities = [p for p in res["priorities"] if "SANS" in p["title"]]
    assert len(sans_priorities) == 1
    assert "sin OCT en este vehículo" in sans_priorities[0]["action"]


def test_critical_flags_never_produce_nominal_priority():
    profile = BaselineProfile()
    # Hipoglucemia sin ansiedad + ruido alto + shift auditivo + HTA severa
    tel = TelemetryInput(
        glucose_mg_dl=58.0,
        systolic_bp=158.0,
        cabin_noise_dba=74.0,
        audiometry_shift_4khz_db=18.0,
    )
    res = evaluate_full_mission_state(profile, tel, lang="en")
    assert res["global_status"] == "critical"
    titles = " | ".join(p["title"] for p in res["priorities"])
    assert "Hypoglycemia" in titles
    assert "Cardiovascular" in titles
    assert "Acoustic Risk" in titles
    assert "Nominal Physiological" not in titles


def test_isolated_moderate_hypertension_does_not_trigger_fast_or_critical():
    profile = BaselineProfile()
    # PAS 170/76 aislada con FC 68, SpO2 98 y sin déficit neurológico -> PRECAUCIÓN, nunca FAST
    tel_mod = TelemetryInput(systolic_bp=170.0, diastolic_bp=76.0, heart_rate_bpm=68.0)
    res_mod = evaluate_full_mission_state(profile, tel_mod, lang="en")
    assert res_mod["global_status"] == "caution"
    cardio_p = [p for p in res_mod["priorities"] if "Cardiovascular" in p["title"]]
    assert len(cardio_p) == 1
    assert cardio_p[0]["severity"] == "caution"
    assert cardio_p[0]["protocol_id"] is None

    # Hipotensión (< 90) o crisis hipertensiva (>= 180/120) sí son críticas
    res_hypo = evaluate_full_mission_state(profile, TelemetryInput(systolic_bp=84.0), lang="en")
    assert res_hypo["global_status"] == "critical"
    assert res_hypo["priorities"][0]["protocol_id"] == "abcde_0g_fast"

    res_crisis = evaluate_full_mission_state(profile, TelemetryInput(systolic_bp=186.0), lang="en")
    assert res_crisis["global_status"] == "critical"
    assert res_crisis["priorities"][0]["protocol_id"] is None


def test_step_telemetry_dt_runs_without_errors():
    profile = BaselineProfile()
    tel = TelemetryInput(environment_id="iss", cdra_scrubber_efficiency=0.2, cabin_ppco2_mmhg=2.5)
    nxt = step_telemetry_dt(tel, dt_minutes=60.0, profile=profile)
    assert nxt.cabin_ppco2_mmhg > tel.cabin_ppco2_mmhg


def test_fastapi_endpoints_isolated_sqlite(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "test_eimo.db")
    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as client:
        assert "mars_base" in client.get("/api/environments?lang=en").json()["environments"]
        protos_en = client.get("/api/protocols?lang=en").json()["protocols"]
        assert "Acute 0g ABCDE" in protos_en["abcde_0g_fast"]["title"]

        # Baseline roundtrip
        r_base = client.post("/api/baseline", json={"callsign": "Test CMO", "mission_day": 12, "auto_advance_mission_day": False})
        assert r_base.status_code == 200
        assert r_base.json()["baseline"]["callsign"] == "Test CMO"

        # Evaluate persist=False vs persist=True + history clear
        r_eval = client.post("/api/evaluate?lang=en&persist=true", json={"environment_id": "transit", "cabin_ppco2_mmhg": 3.8})
        assert r_eval.status_code == 200
        assert r_eval.json()["global_status"] == "caution"
        assert len(client.get("/api/history").json()["history"]) == 1

        r_step = client.post("/api/step?lang=en", json={"telemetry": {"environment_id": "iss", "cdra_scrubber_efficiency": 0.2}, "dt_minutes": 30, "persist": False})
        assert r_step.status_code == 200
        assert "telemetry" in r_step.json()

        # Store-and-Forward create + update + per-packet sync + clear transmitted
        r_emg = client.post(
            "/api/emergency-store-forward",
            json={"environment_id": "transit", "capillary_glucose_mg_dl": 92.0},
        )
        pkt = r_emg.json()["packet"]
        assert pkt["status"] == "QUEUED_FOR_EARTH_LINK"
        assert pkt["rtt_seconds"] == 854.0

        r_upd = client.post(
            "/api/emergency-store-forward",
            json={"packet_id": pkt["packet_id"], "environment_id": "transit", "capillary_glucose_mg_dl": 65.0, "elapsed_seconds": 12},
        )
        assert r_upd.json()["packet"]["packet_id"] == pkt["packet_id"]
        assert r_upd.json()["packet"]["payload"]["hypoglycemia_ruled_out"] is False

        r_sync_one = client.post(f"/api/emergency-queue/{pkt['packet_id']}/sync")
        assert r_sync_one.json()["synced_count"] == 1

        # Post-sync immutability: updating a TRANSMITTED packet creates a new queued packet
        r_after_sync = client.post(
            "/api/emergency-store-forward?lang=en",
            json={"packet_id": pkt["packet_id"], "environment_id": "rover", "capillary_glucose_mg_dl": 98.0},
        )
        pkt_new = r_after_sync.json()["packet"]
        assert pkt_new["packet_id"] != pkt["packet_id"]
        assert pkt_new["status"] == "QUEUED_FOR_EARTH_LINK"
        assert pkt_new["payload"]["environment"] == "Lunar Exploration Rover (Artemis)"

        assert client.delete("/api/emergency-queue/transmitted").json()["queue"] == [pkt_new]
        assert client.delete("/api/history").json()["history"] == []


def test_rover_storm_shelter_swap_and_atmosphere_flammability_hypoxia():
    profile = BaselineProfile()
    tel_rover = TelemetryInput(
        environment_id="rover",
        shielding_posture="storm_shelter",
        spe_event_dose_mgyeq=320.0,
    )
    res = evaluate_full_mission_state(profile, tel_rover, lang="en")
    m3 = res["models"]["radiation_and_lymphocytes"]
    assert m3["storm_shelter_available"] is False
    assert m3["shielding_posture_effective"] == "nominal"
    assert m3["effective_spe_bfo_mgyeq"] == 320.0
    rad_p = [p for p in res["priorities"] if "Radiation" in p["title"]]
    assert rad_p and rad_p[0]["protocol_id"] == "spe_storm_shelter"
    assert "4-6h" in rad_p[0]["action"]
    assert "no 45 g/cm² Storm Shelter" in rad_p[0]["action"]

    tel_flam_hypox = TelemetryInput(cabin_pressure_psia=7.5, cabin_o2_percent=25.0)
    res_atm = evaluate_full_mission_state(profile, tel_flam_hypox, lang="en")
    m2 = res_atm["models"]["cabin_co2_and_alveolar"]
    assert m2["flammability_alert"] is True
    assert m2["cabin_hypoxia"] is True
    assert m2["estimated_inspired_po2_mmhg"] < 100.0
    atm_p = [p for p in res_atm["priorities"] if "Cabin Atmosphere" in p["title"]]
    assert len(atm_p) == 1
    assert "V2 11040" in atm_p[0]["detail"]


def test_pydantic_validation_and_all_demo_scenarios(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "test_scenarios.db")
    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as client:
        assert client.post("/api/evaluate", json={"systolic_bp": 999.0}).status_code == 422
        assert client.post("/api/evaluate", json={"environment_id": "invalid_ship"}).status_code == 422

        scenarios = client.get("/api/scenarios?lang=en").json()["scenarios"]
        assert len(scenarios) >= 8
        for sid, sc in scenarios.items():
            r = client.post("/api/evaluate?lang=en&persist=false", json=sc["telemetry"])
            assert r.status_code == 200, f"Scenario {sid} failed evaluation"
            data = r.json()
            assert data["global_status"] in ("nominal", "caution", "critical")

        # Pre-descent fluid loading contraindicated at SBP >= 150 mmHg and OIG / Kentavr available in ISS
        r_bp = client.post(
            "/api/evaluate?lang=en&persist=false",
            json={"environment_id": "iss", "is_planetary_descent_soon": True, "systolic_bp": 156.0},
        ).json()
        pre_p = [p for p in r_bp["priorities"] if "Pre-Descent" in p["title"]]
        assert pre_p and "DO NOT run aggressive NaCl" in pre_p[0]["action"]
        assert "OIG / Kentavr" in pre_p[0]["action"]

        r_hyp = client.post(
            "/api/evaluate?lang=en&persist=false",
            json={"cabin_pressure_psia": 7.5, "cabin_o2_percent": 21.0, "gad2_score": 4, "hrv_rmssd_ms": 20.0},
        ).json()
        assert "hypoxia" in r_hyp["models"]["neuro_and_anxiety"]["organic_mimic_keys"]
        assert r_hyp["models"]["neuro_and_anxiety"]["recommend_01hz_breathing"] is False

        # Structured GCS and nullable vitals in Store-and-Forward (no fabricated vitals)
        r_gcs = client.post(
            "/api/emergency-store-forward?lang=en",
            json={"environment_id": "iss", "gcs_score": 13, "capillary_glucose_mg_dl": None},
        ).json()
        assert r_gcs["packet"]["payload"]["gcs_score"] == 13
        assert r_gcs["packet"]["payload"]["hypoglycemia_ruled_out"] is None
        assert r_gcs["packet"]["payload"]["vitals"]["glucose_mg_dl"] is None

        # Low glucose never recommends LBNP (even with elevated ONSD) and ppCO2 drop stays nominal
        r_low_glu = client.post(
            "/api/evaluate?lang=en&persist=false",
            json={"environment_id": "iss", "glucose_mg_dl": 58.0, "onsd_measured_mm": 5.5},
        ).json()
        assert r_low_glu["models"]["hydrostatics_and_fluids"]["lbnp_safe"] is False
        assert r_low_glu["models"]["hydrostatics_and_fluids"]["lbnp_locks"]["hypoglycemia_syncope_risk"] is True
        assert all(p["protocol_id"] != "lbnp_safety" for p in r_low_glu["priorities"])

        r_drop_co2 = client.post(
            "/api/evaluate?lang=en&persist=false",
            json={"environment_id": "iss", "cabin_ppco2_mmhg": 0.2},
        ).json()
        assert r_drop_co2["global_status"] == "nominal"
        assert r_drop_co2["priorities"][0]["protocol_id"] is None


def test_health_and_spa_routing(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "test_spa.db")
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text("<html><body>EIMO SPA</body></html>", encoding="utf-8")

    import main as app_main
    from fastapi.testclient import TestClient

    monkeypatch.setattr(app_main, "FRONTEND_DIST_DIR", dist_dir.resolve())

    with TestClient(app_main.app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        missing_api = client.get("/api/does-not-exist")
        assert missing_api.status_code == 404

        root = client.get("/")
        assert root.status_code == 200
        assert "EIMO SPA" in root.text

        traversal = client.get("/../backend/main.py")
        assert traversal.status_code == 200
        assert "EIMO SPA" in traversal.text
