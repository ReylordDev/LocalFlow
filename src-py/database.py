import sqlite3
from models import HistoryItem
from utils.utils import get_user_data_path
from loguru import logger


def initialize_db():
    # Intialize the database that contains a history of the transcriptions
    conn = sqlite3.connect(f"{get_user_data_path()}/transcriptions.db")
    c = conn.cursor()

    c.execute(
        """CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_transcription TEXT,
            formatted_transcription TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    conn.commit()

    return conn


def commit_transcription_to_db(
    db: sqlite3.Connection, transcription: str, formatted_transcription: str
):
    db.cursor().execute(
        "INSERT INTO transcriptions (raw_transcription, formatted_transcription) VALUES (?, ?)",
        (transcription, formatted_transcription),
    )

    db.commit()


def get_all_transcriptions_from_db(db: sqlite3.Connection):
    c = db.cursor()
    c.execute("SELECT * FROM transcriptions ORDER BY created_at DESC")
    transcriptions = c.fetchall()
    logger.info(f"Length of transcriptions: {len(transcriptions)}")
    return [
        HistoryItem(
            id=row[0],
            raw_transcription=row[1],
            formatted_transcription=row[2],
            created_at=row[3],
        )
        for row in transcriptions
    ]


def delete_transcription_from_db(db: sqlite3.Connection, transcription_id: int):
    db.cursor().execute("DELETE FROM transcriptions WHERE id = ?", (transcription_id,))
    db.commit()
