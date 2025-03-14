import os
import sqlite3

from sqlmodel import SQLModel, create_engine, Session, select
from models import HistoryItem, LanguageModel, Mode, Prompt, VoiceModel
from utils.utils import get_user_data_path
from loguru import logger

import ollama


class DatabaseManager:
    def __init__(self, echo=False):
        logger.debug("Initializing DatabaseManager")
        sql_file_name = get_user_data_path() + "/database.db"
        if not os.path.exists(sql_file_name):
            with open(sql_file_name, "w") as f:
                f.write("")
        self.engine = create_engine(f"sqlite:///{sql_file_name}", echo=echo)
        SQLModel.metadata.create_all(self.engine)
        self.create_voice_models()
        self.create_language_models()
        self.create_default_modes()
        logger.debug("DatabaseManager initialized")

    def get_engine(self):
        return self.engine

    def create_session(self):
        return Session(self.engine)

    def create_voice_models(self):
        with self.create_session() as session:
            created_models = []
            created_models.append(
                VoiceModel(
                    name="large-v3-turbo",
                    language="multilingual",
                    speed=100,
                    accuracy=80,
                    size=1500,
                    parameters=809_000_000,
                )
            )

            created_models.append(
                VoiceModel(
                    name="large-v3",
                    language="multilingual",
                    speed=60,
                    accuracy=90,
                    size=2870,
                    parameters=1_550_000_000,
                )
            )

            created_models.append(
                VoiceModel(
                    name="distil-large-v3",
                    language="english-only",
                    speed=100,
                    accuracy=70,
                    size=1400,
                    parameters=756_000_000,
                )
            )

            # Check if the models already exist in the database
            existing_models = session.exec(select(VoiceModel)).all()
            existing_model_names = {model.name for model in existing_models}

            for model in created_models:
                if model.name not in existing_model_names:
                    session.add(model)

            session.commit()

    def create_language_models(self):
        list_response = ollama.list()
        models = list_response.models
        with self.create_session() as session:
            existing_models = session.exec(select(LanguageModel)).all()
            existing_model_names = {model.name for model in existing_models}
            created_models = []
            for model in models:
                if model.model and model.model not in existing_model_names:
                    language_model = LanguageModel(
                        name=model.model,
                    )
                    created_models.append(language_model)
                    logger.info(f"Language model created: {model.model}")
            session.add_all(created_models)
            session.commit()

    def create_default_modes(self):
        with self.create_session() as session:
            existing_default_modes = session.exec(
                select(Mode).where(Mode.default)
            ).all()
            voice_only = Mode(
                name="Voice Only",
                voice_language="en",
                voice_model_id="large-v3-turbo",
                default=True,
            )
            general = Mode(
                name="General",
                voice_language="auto",
                voice_model_id="large-v3-turbo",
                language_model_id="gemma3:4b",
                prompt=Prompt(
                    system_prompt="You are a helpful assistant. Fix any grammar, spelling or punctuation mistakes in the following text."
                ),
                use_language_model=True,
                default=True,
            )

            if voice_only.name not in [mode.name for mode in existing_default_modes]:
                session.add(voice_only)
                logger.info("Default mode created: Voice Only")
            if general.name not in [mode.name for mode in existing_default_modes]:
                session.add(general)
                logger.info("Default mode created: General")

            session.commit()


# Outdated
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


# Outdated
def commit_transcription_to_db(
    db: sqlite3.Connection, transcription: str, formatted_transcription: str
):
    db.cursor().execute(
        "INSERT INTO transcriptions (raw_transcription, formatted_transcription) VALUES (?, ?)",
        (transcription, formatted_transcription),
    )

    db.commit()


# Outdated
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


if __name__ == "__main__":
    db = DatabaseManager()
    with db.create_session() as session:
        pass  # Use the session for database operations here
