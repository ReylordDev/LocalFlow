import os
from uuid import UUID

from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.orm import subqueryload
from models import LanguageModel, Mode, Prompt, Result, VoiceModel
from utils.utils import get_temp_path, get_user_data_path
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

    def get_active_mode(self):
        with self.create_session() as session:
            active_mode = session.exec(
                select(Mode)
                .where(Mode.active)
                .options(
                    subqueryload(Mode.voice_model),  # type: ignore
                    subqueryload(Mode.language_model),  # type: ignore
                    subqueryload(Mode.prompt),  # type: ignore
                )
            ).first()  # type: ignore
            if not active_mode:
                # If no active mode is found, return the default mode
                active_mode = session.exec(
                    select(Mode)
                    .where(Mode.default)
                    .options(
                        subqueryload(Mode.voice_model),  # type: ignore
                        subqueryload(Mode.language_model),  # type: ignore
                        subqueryload(Mode.prompt),  # type: ignore
                    ),
                ).first()  # type: ignore
            if not active_mode:
                logger.warning("No default mode found")
                raise Exception("No default mode found")
            return active_mode

    def get_mode(self, mode_id: UUID):
        with self.create_session() as session:
            mode = session.exec(
                select(Mode)
                .where(Mode.id == mode_id)
                .options(
                    subqueryload(Mode.voice_model),  # type: ignore
                    subqueryload(Mode.language_model),  # type: ignore
                    subqueryload(Mode.prompt),  # type: ignore
                )
            ).first()
            if not mode:
                logger.warning(f"Mode not found: {mode_id}")
                raise Exception(f"Mode not found: {mode_id}")
            return mode

    def get_mode_by_name(self, mode_name: str):
        with self.create_session() as session:
            mode = session.exec(
                select(Mode)
                .where(Mode.name == mode_name)
                .options(
                    subqueryload(Mode.voice_model),  # type: ignore
                    subqueryload(Mode.language_model),  # type: ignore
                    subqueryload(Mode.prompt),  # type: ignore
                )
            ).first()
            if not mode:
                logger.warning(f"Mode not found: {mode_name}")
                raise Exception(f"Mode not found: {mode_name}")
            return mode

    def save_result(self, result: Result):
        # Copy the temp files to the results folder
        temp_location = get_temp_path()
        result_location = result.location

        os.makedirs(result_location, exist_ok=True)
        os.rename(f"{temp_location}/recording.wav", f"{result_location}/recording.wav")
        os.rename(
            f"{temp_location}/recording.flac", f"{result_location}/recording.flac"
        )

        # Save the result to the database
        with self.create_session() as session:
            session.add(result)
            session.commit()
            logger.info(f"Result saved: {result.id}")
        return result


if __name__ == "__main__":
    db = DatabaseManager()
    with db.create_session() as session:
        pass
