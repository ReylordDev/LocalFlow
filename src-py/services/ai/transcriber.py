import gc
from loguru import logger
from faster_whisper import WhisperModel
from models.db import Mode, TextReplacement
from models.exceptions import ModelNotLoadedException


class Transcriber:
    def __init__(
        self, mode: Mode, global_text_replacements: list[TextReplacement] = []
    ):
        self.mode = mode
        self.global_text_replacements = global_text_replacements
        self.model = None

    def transcribe_audio(self, file_name: str, language: str | None = None):
        raise NotImplementedError

    def get_voice_language(self):
        return self.mode.voice_language

    # def set_language(self, language: str):
    #     self.language = language

    def load_model(self):
        raise NotImplementedError

    def unload_model(self):
        raise NotImplementedError


class LocalTranscriber(Transcriber):
    def __init__(
        self, mode: Mode, global_text_replacements: list[TextReplacement] = []
    ):
        super().__init__(mode, global_text_replacements)

    def load_model(self):
        self.model = WhisperModel(
            model_size_or_path=self.mode.voice_model.name,
            device="cuda",
            local_files_only=True,
        )
        logger.info(f"{self.mode.voice_model.name} loaded into memory")

    def unload_model(self):
        del self.model
        self.model = None
        gc.collect()
        logger.info(f"{self.mode.voice_model.name} unloaded from memory")

    def transcribe_audio(
        self,
        file_name: str,
    ):
        if not self.model:
            raise ModelNotLoadedException()
        with open(file_name, "rb") as file:
            logger.info(
                f"Transcribing {file_name} using {self.mode.voice_model.name}, language: {self.get_voice_language()}"
            )
            language = (
                self.get_voice_language()
                if self.get_voice_language() != "auto"
                else None
            )
            task = "transcribe" if not self.mode.translate_to_english else "translate"
            logger.debug(f"Transcription task: {task}")
            segments, info = self.model.transcribe(
                file,
                beam_size=5,
                language=language,
                vad_filter=True,
                temperature=0.0,
                task=task,
            )
            logger.debug(
                f"Language: {info.language} ({info.language_probability * 100:.2f}%)"
            )
            transcription = ""
            for segment in segments:
                transcription += segment.text
            transcription = transcription.strip()
            logger.info(f'Transcription: "{transcription}"')

            text_replacements = (
                self.global_text_replacements + self.mode.text_replacements
            )

            logger.debug(f"Text replacements: {text_replacements}")
            prev_transcription = transcription
            for tr in text_replacements:
                transcription = tr.apply_replacement(transcription)

            if transcription != prev_transcription:
                logger.info(f"Transcription after replacements: {transcription}")

            # self.set_language(info.language)
            return transcription
