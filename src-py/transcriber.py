import gc
from loguru import logger
from faster_whisper import WhisperModel
from models import LanguageType, ModelNotLoadedException, VoiceModel


class Transcriber:
    def __init__(self, voice_model: VoiceModel, language: LanguageType):
        self.voice_model = voice_model
        self.language = language
        self.model = None

    def transcribe_audio(self, file_name: str, language: str | None = None):
        raise NotImplementedError

    def get_language(self):
        return self.language

    def set_language(self, language: str):
        self.language = language

    def load_model(self):
        raise NotImplementedError

    def unload_model(self):
        raise NotImplementedError


class LocalTranscriber(Transcriber):
    # Maybe I should turn this into into a type safe class

    def __init__(self, voice_model: VoiceModel, language: LanguageType):
        super().__init__(voice_model, language)

    def load_model(self):
        self.model = WhisperModel(
            model_size_or_path=self.voice_model.name, device="cuda"
        )
        logger.info(f"{self.voice_model.name} loaded into memory")

    def unload_model(self):
        del self.model
        self.model = None
        gc.collect()
        logger.info(f"{self.voice_model.name} unloaded from memory")

    def transcribe_audio(
        self,
        file_name: str,
    ):
        if not self.model:
            raise ModelNotLoadedException()
        with open(file_name, "rb") as file:
            logger.info(
                f"Transcribing {file_name} using {self.voice_model.name}, language: {self.language}"
            )
            language = self.language if self.language != "auto" else None
            segments, info = self.model.transcribe(
                file,
                beam_size=5,
                language=language,
                vad_filter=True,
                temperature=0.0,
            )
            logger.debug(
                f"Language: {info.language} ({info.language_probability * 100:.2f}%)"
            )
            transcription = ""
            for segment in segments:
                transcription += segment.text
            logger.info(f'Transcription: "{transcription}"')
            self.set_language(info.language)
            return transcription
