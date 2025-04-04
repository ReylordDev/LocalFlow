import os
from uuid import UUID

from sqlmodel import SQLModel, create_engine, Session, select, desc
from sqlalchemy.orm import subqueryload
from models import (
    Example,
    ExampleBase,
    LanguageModel,
    Mode,
    ModeCreate,
    ModeUpdate,
    Prompt,
    PromptUpdate,
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
            _ = self.get_active_mode()
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
                voice_model_id=large_v3_turbo.id,
                default=True,
            )
            general = Mode(
                name="General",
                voice_language="auto",
                voice_model_id=large_v3_turbo.id,
                language_model_id="gemma3:4b",
                use_language_model=True,
                default=True,
                active=missing_active,
            )
            general_prompt = Prompt(
                system_prompt="You are a helpful assistant. Fix any grammar, spelling or punctuation mistakes in the following text.",
                mode_id=general.id,
            )
            general_prompt.examples = [
                Example(
                    input="I am a big fan of the show.",
                    output="I am a big fan of the show.",
                    prompt_id=general_prompt.id,
                )
            ]
            general.prompt = general_prompt

            if voice_only.name not in [mode.name for mode in existing_default_modes]:
                session.add(voice_only)
                logger.info("Default mode created: Voice Only")
            if general.name not in [mode.name for mode in existing_default_modes]:
                session.add(general)
                logger.info("Default mode created: General")

            session.commit()

    def get_active_mode(self) -> Mode:
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
            logger.info(f"Active mode: {active_mode}")
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

        with self.create_session() as session:
            # Create the new mode
            new_mode = Mode(
                name=mode.name,
                voice_language=mode.voice_language,
                voice_model=voice_model,
                voice_model_id=voice_model.id,
                language_model_id=mode.language_model_name,
                use_language_model=mode.use_language_model,
                default=mode.default,
                active=mode.active,
                record_system_audio=mode.record_system_audio,
                translate_to_english=mode.translate_to_english,
                text_replacements=text_replacements,
            )
            if mode.prompt:
                new_prompt = Prompt(
                    system_prompt=mode.prompt.system_prompt,
                    include_clipboard=mode.prompt.include_clipboard,
                    include_active_window=mode.prompt.include_active_window,
                    mode_id=new_mode.id,
                )
                new_prompt.examples = [
                    Example(
                        input=example.input,
                        output=example.output,
                        prompt_id=new_prompt.id,
                    )
                    for example in mode.prompt.examples
                ]
                new_mode.prompt = new_prompt
            session.add(new_mode)
            session.commit()
            logger.info(f"Mode created: {new_mode.id}")
            return new_mode

    def update_mode(self, mode_update: ModeUpdate):
        with self.create_session() as session:
            mode = session.exec(select(Mode).where(Mode.id == mode_update.id)).first()
            if not mode:
                logger.warning(f"Mode not found: {mode_update.id}")
                raise Exception(f"Mode not found: {mode_update.id}")

            # Update the mode attributes
            for key in mode_update.model_fields_set:
                if key == "id":
                    continue
                if key not in mode.model_fields.keys() or key == "text_replacements":
                    continue
                logger.debug(f"Updating mode attribute: {key}")
                setattr(mode, key, getattr(mode_update, key))

            if "text_replacements" in mode_update.model_fields_set:
                # Clear existing text replacements
                for existing_text_replacement in mode.text_replacements:
                    session.delete(existing_text_replacement)
                if mode_update.text_replacements:
                    # Create new text replacements
                    for text_replacement_base in mode_update.text_replacements:
                        text_replacement = self.create_text_replacement(
                            text_replacement_base
                        )
                        mode.text_replacements.append(text_replacement)
                    logger.debug(
                        f"Text replacements updated: {len(mode.text_replacements)}"
                    )
                else:
                    logger.debug("Text replacements emptied")
                    mode.text_replacements = []

            if "voice_model_name" in mode_update.model_fields_set:
                if not mode_update.voice_model_name:
                    logger.warning("Voice model name is set empty")
                    raise Exception("Voice model name is set but empty")
                voice_model = self.get_voice_model_by_name(mode_update.voice_model_name)
                mode.voice_model = voice_model
                logger.debug(f"Voice model set to {mode.voice_model.name}")

            if "language_model_name" in mode_update.model_fields_set:
                if not mode_update.language_model_name:
                    logger.debug("Removed language model")
                    mode.language_model = None
                else:
                    language_model = self.get_language_model_by_name(
                        mode_update.language_model_name
                    )
                    logger.debug(f"Language model set to {language_model.name}")
                    mode.language_model = language_model

            if "prompt" in mode_update.model_fields_set:
                if not mode_update.prompt:
                    logger.debug("Removed prompt")
                    mode.prompt = None
                elif mode.prompt:
                    # Update existing prompt
                    for key in mode_update.prompt.model_fields_set:
                        if (
                            key not in mode_update.prompt.model_fields.keys()
                            or key == "examples"
                        ):
                            continue
                        logger.debug(f"Updating prompt attribute: {key}")
                        setattr(mode.prompt, key, getattr(mode_update.prompt, key))

                    if "examples" in mode_update.prompt.model_fields_set:
                        # Clear existing examples
                        for existing_example in mode.prompt.examples:
                            session.delete(existing_example)
                        if not mode_update.prompt.examples:
                            logger.debug("Examples emptied")
                            mode.prompt.examples = []
                        else:
                            # Create new examples
                            mode.prompt.examples = [
                                Example(
                                    input=example.input,
                                    output=example.output,
                                    prompt_id=mode.prompt.id,
                                )
                                for example in mode_update.prompt.examples
                            ]
                            logger.debug(
                                f"Examples updated: {len(mode.prompt.examples)}"
                            )
                elif not mode.prompt:
                    # Create new prompt
                    new_prompt = Prompt(
                        mode_id=mode.id,
                        system_prompt=mode_update.prompt.system_prompt
                        if mode_update.prompt.system_prompt
                        else "",
                    )
                    for key in mode_update.prompt.model_fields_set:
                        if key == "id" or key == "system_prompt":
                            continue
                        if key not in mode_update.prompt.model_fields.keys():
                            logger.warning(
                                f"Prompt attribute not found in mode_update: {key}"
                            )
                            continue
                        logger.debug(f"Updating prompt attribute: {key}")
                        setattr(new_prompt, key, getattr(mode_update.prompt, key))

                    if mode_update.prompt.examples:
                        new_prompt.examples = [
                            Example(
                                input=example.input,
                                output=example.output,
                                prompt_id=new_prompt.id,
                            )
                            for example in mode_update.prompt.examples
                        ]
                    else:
                        new_prompt.examples = []
                    mode.prompt = new_prompt
                    logger.debug("New Prompt created")

            session.add(mode)
            session.commit()
            session.refresh(mode)
            logger.info(f"Mode updated: {mode.id}")
            return mode

    def delete_mode(self, mode_id: UUID):
        with self.create_session() as session:
            # Get the mode to delete
            mode = session.exec(select(Mode).where(Mode.id == mode_id)).first()
            if not mode:
                logger.warning(f"Mode not found: {mode_id}")
                raise Exception(f"Mode not found: {mode_id}")

            # Delete the mode
            session.delete(mode)
            session.commit()
            logger.info(f"Mode deleted: {mode.id}")

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

    def delete_result(self, result_id: UUID):
        with self.create_session() as session:
            # Get the result to delete
            result = session.exec(select(Result).where(Result.id == result_id)).first()
            if not result:
                logger.warning(f"Result not found: {result_id}")
                raise Exception(f"Result not found: {result_id}")

            # Delete the result
            session.delete(result)
            session.commit()
            logger.info(f"Result deleted: {result.id}")

    def get_all_results(self):
        with self.create_session() as session:
            results = session.exec(
                select(Result).order_by(desc(Result.created_at))
            ).all()
            return results

    def add_example(self, prompt_id: UUID, example: ExampleBase):
        with self.create_session() as session:
            # Get the prompt to add the example to
            prompt = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
            if not prompt:
                logger.warning(f"Prompt not found: {prompt_id}")
                raise Exception(f"Prompt not found: {prompt_id}")

            # Create the new example
            new_example = Example(
                input=example.input,
                output=example.output,
                prompt_id=prompt.id,
            )
            session.add(new_example)
            session.commit()
            logger.info(f"Example added: {new_example.id}")
            return new_example


if __name__ == "__main__":
    db = DatabaseManager()
    original_mode = db.get_mode(UUID("cd0c2ec2061d4cd6a0520f0d5bb1fb04"))
    updated_mode = db.update_mode(
        ModeUpdate(
            name=original_mode.name,
            voice_language=original_mode.voice_language,
            voice_model_name=original_mode.voice_model.name,
            id=original_mode.id,
            language_model_name=original_mode.language_model.name
            if original_mode.language_model
            else None,
            active=original_mode.active,
            default=original_mode.default,
            use_language_model=original_mode.use_language_model,
            record_system_audio=original_mode.record_system_audio,
            translate_to_english=original_mode.translate_to_english,
            prompt=PromptUpdate(
                system_prompt=original_mode.prompt.system_prompt
                if original_mode.prompt
                else "",
                examples=[
                    ExampleBase(
                        input="What the capital of France?",
                        output="The capital of France is Paris.",
                    ),
                    ExampleBase(
                        input="What the capital of Germany?",
                        output="The capital of France is Berlin.",
                    ),
                ],
            ),
            text_replacements=[
                TextReplacementBase(
                    original_text="Hello",
                    replacement_text="Hi",
                )
            ],
        )
    )

    mode = db.get_mode(updated_mode.id)

    logger.info(f"Retrieved mode: {mode.id}")
    if mode.prompt:
        logger.info(f"Examples: {mode.prompt.examples}")
