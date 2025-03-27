import os
from uuid import UUID

from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.orm import subqueryload
from models import (
    Example,
    ExampleBase,
    LanguageModel,
    Mode,
    ModeCreate,
    ModeUpdate,
    Prompt,
    PromptBase,
    Result,
    TextReplacement,
    TextReplacementBase,
    VoiceModel,
)
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
        try:
            active_mode = self.get_active_mode()
            missing_active = False
        except Exception:
            missing_active = True

        large_v3_turbo = self.get_voice_model_by_name("large-v3-turbo")
        with self.create_session() as session:
            existing_default_modes = session.exec(
                select(Mode).where(Mode.default)
            ).all()
            voice_only = Mode(
                name="Voice Only",
                voice_language="en",
                voice_model=large_v3_turbo,
                voice_model_id=large_v3_turbo.id,
                default=True,
                active=missing_active,
            )
            general_prompt = Prompt(
                system_prompt="You are a helpful assistant. Fix any grammar, spelling or punctuation mistakes in the following text.",
            )
            general_prompt.examples = [
                Example(
                    input="I am a big fan of the show.",
                    output="I am a big fan of the show.",
                    prompt_id=general_prompt.id,
                )
            ]
            general = Mode(
                name="General",
                voice_language="auto",
                voice_model=large_v3_turbo,
                voice_model_id=large_v3_turbo.id,
                language_model_id="gemma3:4b",
                use_language_model=True,
                default=True,
                prompt=general_prompt,
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
                raise Exception("No default mode found")
            return active_mode

    def get_mode(self, mode_id: UUID) -> Mode:
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

    def get_all_modes(self):
        with self.create_session() as session:
            modes = session.exec(
                select(Mode).options(
                    subqueryload(Mode.voice_model),  # type: ignore
                    subqueryload(Mode.language_model),  # type: ignore
                    subqueryload(Mode.prompt),  # type: ignore
                )
            ).all()
            return modes

    def create_text_replacement(self, text_replacement: TextReplacementBase):
        with self.create_session() as session:
            # Create the new text replacement
            text_replacement = TextReplacement(
                original_text=text_replacement.original_text,
                replacement_text=text_replacement.replacement_text,
                mode_id=None,
            )
            session.add(text_replacement)
            session.commit()
            logger.info(f"Text replacement created: {text_replacement.id}")
            return text_replacement

    def create_prompt(self, prompt: PromptBase):
        with self.create_session() as session:
            # Create the new prompt
            prompt = Prompt(
                system_prompt=prompt.system_prompt,
                include_clipboard=prompt.include_clipboard,
                include_active_window=prompt.include_active_window,
            )
            session.add(prompt)
            session.commit()
            logger.info(f"Prompt created: {prompt.id}")
            return prompt

    def get_voice_model_by_name(self, voice_model_name: str) -> VoiceModel:
        with self.create_session() as session:
            voice_model = session.exec(
                select(VoiceModel).where(VoiceModel.name == voice_model_name)
            ).first()
            if not voice_model:
                logger.warning(f"Voice model not found: {voice_model_name}")
                raise Exception(f"Voice model not found: {voice_model_name}")
            return voice_model

    def get_language_model_by_name(self, language_model_name: str) -> LanguageModel:
        with self.create_session() as session:
            language_model = session.exec(
                select(LanguageModel).where(LanguageModel.name == language_model_name)
            ).first()
            if not language_model:
                logger.warning(f"Language model not found: {language_model_name}")
                raise Exception(f"Language model not found: {language_model_name}")
            return language_model

    def create_mode(self, mode: ModeCreate):
        voice_model = self.get_voice_model_by_name(mode.voice_model_name)
        text_replacements = []
        for text_replacement_base in mode.text_replacements:
            text_replacement = self.create_text_replacement(text_replacement_base)
            text_replacements.append(text_replacement)
        prompt = self.create_prompt(mode.prompt) if mode.prompt else None

        with self.create_session() as session:
            # Create the new mode
            new_mode = Mode(
                name=mode.name,
                voice_language=mode.voice_language,
                voice_model=voice_model,
                voice_model_id=voice_model.id,
                language_model_id=mode.language_model_name,
                prompt=prompt,
                use_language_model=mode.use_language_model,
                default=mode.default,
                active=mode.active,
                record_system_audio=mode.record_system_audio,
                translate_to_english=mode.translate_to_english,
                text_replacements=text_replacements,
            )
            session.add(new_mode)
            session.commit()
            logger.info(f"Mode created: {new_mode.id}")
            return new_mode

    def update_mode(self, mode: ModeUpdate):
        voice_model = self.get_voice_model_by_name(mode.voice_model_name)
        language_model = (
            self.get_language_model_by_name(mode.language_model_name)
            if mode.language_model_name
            else None
        )
        text_replacements = []
        for text_replacement_base in mode.text_replacements:
            text_replacement = self.create_text_replacement(text_replacement_base)
            text_replacements.append(text_replacement)
        prompt = self.create_prompt(mode.prompt) if mode.prompt else None
        with self.create_session() as session:
            # Get the existing mode
            existing_mode = session.exec(select(Mode).where(Mode.id == mode.id)).first()
            if not existing_mode:
                logger.warning(f"Mode not found: {mode.id}")
                raise Exception(f"Mode not found: {mode.id}")

            # Update the mode attributes
            existing_mode.name = mode.name
            existing_mode.voice_language = mode.voice_language
            if existing_mode.voice_model.id != voice_model.id:
                existing_mode.voice_model = voice_model
            existing_mode.use_language_model = mode.use_language_model
            if (
                language_model
                and (
                    existing_mode.language_model
                    and existing_mode.language_model.name != language_model.name
                )
                or not existing_mode.language_model
            ):
                existing_mode.language_model = language_model
            existing_mode.prompt = prompt
            existing_mode.default = mode.default
            existing_mode.active = mode.active
            existing_mode.record_system_audio = mode.record_system_audio
            existing_mode.translate_to_english = mode.translate_to_english
            existing_mode.text_replacements = text_replacements

            # Commit the changes to the database
            session.add(existing_mode)
            session.commit()
            session.refresh(existing_mode)
            logger.info(f"Mode updated: {existing_mode.id}")
            return existing_mode

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
        id = UUID("25c68e1960704a859c977ddb65551d6d")
        mode = db.get_mode(id)
        dict = mode.model_dump()
        json = mode.model_dump_json(indent=2)
        logger.info(json)
