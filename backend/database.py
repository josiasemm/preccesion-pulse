"""
Persistencia local Offline-First en SQLite (EIMO Astronaut Health CDSS).
Almacena la Ficha + Línea Base (OCHMO-STD-100.1A), el historial de evaluaciones
y la cola asíncrona de paquetes Store-and-Forward para Control de Misión en Tierra.
"""

from contextlib import contextmanager
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Iterator

DB_PATH = Path(__file__).parent / "eimo_cdss.db"


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS baseline_profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS evaluation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            environment_id TEXT NOT NULL,
            global_status TEXT NOT NULL,
            telemetry_json TEXT NOT NULL,
            result_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS store_and_forward_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            rtt_seconds REAL NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )


REQUIRED_TABLES = ("baseline_profile", "evaluation_logs", "store_and_forward_queue")


def _safe_json_loads(raw: str | None) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


@contextmanager
def get_conn(ensure_schema: bool = True, write_tx: bool = False) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA busy_timeout=5000")
        if ensure_schema:
            count_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name IN (?, ?, ?)",
                REQUIRED_TABLES,
            ).fetchone()
            if not count_row or int(count_row["cnt"]) < len(REQUIRED_TABLES):
                _create_tables(conn)
        if write_tx:
            conn.execute("BEGIN IMMEDIATE")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_conn(ensure_schema=False, write_tx=False) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        _create_tables(conn)


def save_baseline_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with get_conn(write_tx=True) as conn:
        conn.execute(
            """
            INSERT INTO baseline_profile (id, data_json, updated_at)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
            """,
            (json.dumps(profile_dict, ensure_ascii=False), now),
        )
    return profile_dict


def load_baseline_profile() -> Dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute("SELECT data_json FROM baseline_profile WHERE id = 1").fetchone()
        if row:
            parsed = _safe_json_loads(row["data_json"])
            return parsed or None
    return None


def log_evaluation(env_id: str, global_status: str, telemetry: Dict[str, Any], _result: Dict[str, Any]) -> int:
    now = datetime.now(timezone.utc).isoformat()
    with get_conn(write_tx=True) as conn:
        cur = conn.execute(
            """
            INSERT INTO evaluation_logs (environment_id, global_status, telemetry_json, result_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                env_id,
                global_status,
                json.dumps(telemetry, ensure_ascii=False),
                "{}",
                now,
            ),
        )
        return int(cur.lastrowid)


def get_recent_evaluations(limit: int = 15) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, environment_id, global_status, telemetry_json, created_at FROM evaluation_logs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "environment_id": r["environment_id"],
                "global_status": r["global_status"],
                "telemetry": _safe_json_loads(r["telemetry_json"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]


def enqueue_store_and_forward(event_type: str, rtt_seconds: float, payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with get_conn(write_tx=True) as conn:
        cur = conn.execute(
            """
            INSERT INTO store_and_forward_queue (event_type, rtt_seconds, payload_json, status, created_at)
            VALUES (?, ?, ?, 'QUEUED_FOR_EARTH_LINK', ?)
            """,
            (event_type, rtt_seconds, json.dumps(payload, ensure_ascii=False), now),
        )
        packet_id = int(cur.lastrowid)
    return {
        "packet_id": packet_id,
        "event_type": event_type,
        "rtt_seconds": rtt_seconds,
        "status": "QUEUED_FOR_EARTH_LINK",
        "created_at": now,
        "payload": payload,
    }


def update_store_and_forward_packet(
    packet_id: int, event_type: str, rtt_seconds: float, payload: Dict[str, Any]
) -> Dict[str, Any] | None:
    """Actualiza únicamente paquetes aún en cola; paquetes ya transmitidos permanecen inmutables."""
    with get_conn(write_tx=True) as conn:
        row = conn.execute(
            "SELECT status, created_at FROM store_and_forward_queue WHERE id = ?",
            (packet_id,),
        ).fetchone()
        if not row or row["status"] != "QUEUED_FOR_EARTH_LINK":
            return None
        conn.execute(
            """
            UPDATE store_and_forward_queue
            SET event_type = ?, rtt_seconds = ?, payload_json = ?
            WHERE id = ? AND status = 'QUEUED_FOR_EARTH_LINK'
            """,
            (event_type, rtt_seconds, json.dumps(payload, ensure_ascii=False), packet_id),
        )
        return {
            "packet_id": packet_id,
            "event_type": event_type,
            "rtt_seconds": rtt_seconds,
            "status": row["status"],
            "created_at": row["created_at"],
            "payload": payload,
        }


def get_store_and_forward_queue(limit: int = 20) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, event_type, rtt_seconds, payload_json, status, created_at FROM store_and_forward_queue ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "packet_id": r["id"],
                "event_type": r["event_type"],
                "rtt_seconds": r["rtt_seconds"],
                "payload": _safe_json_loads(r["payload_json"]),
                "status": r["status"],
                "created_at": r["created_at"],
            }
            for r in rows
        ]


def sync_store_and_forward_queue() -> int:
    with get_conn(write_tx=True) as conn:
        cur = conn.execute(
            """
            UPDATE store_and_forward_queue
            SET status = 'TRANSMITTED_TO_MCC'
            WHERE status = 'QUEUED_FOR_EARTH_LINK'
            """
        )
        return int(cur.rowcount)


def sync_single_packet(packet_id: int) -> int:
    """Marca un único paquete de Carril 2 como transmitido cuando vence su RTT específico."""
    with get_conn(write_tx=True) as conn:
        cur = conn.execute(
            """
            UPDATE store_and_forward_queue
            SET status = 'TRANSMITTED_TO_MCC'
            WHERE id = ? AND status = 'QUEUED_FOR_EARTH_LINK'
            """,
            (packet_id,),
        )
        return int(cur.rowcount)


def clear_evaluation_logs() -> int:
    """Elimina registros de telemetría de prueba conservando el perfil basal."""
    with get_conn(write_tx=True) as conn:
        cur = conn.execute("DELETE FROM evaluation_logs")
        return int(cur.rowcount)


def clear_transmitted_queue() -> int:
    """Elimina únicamente los paquetes ya transmitidos a Control de Misión."""
    with get_conn(write_tx=True) as conn:
        cur = conn.execute(
            "DELETE FROM store_and_forward_queue WHERE status != 'QUEUED_FOR_EARTH_LINK'"
        )
        return int(cur.rowcount)
