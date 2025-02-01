from typing import Literal
from loguru import logger
from faster_whisper import WhisperModel
from models import ModelNotLoadedException


class Transcriber:
    def __init__(self, language: str | None = None):
        self.language = language
        pass

    def transcribe_audio(self, file_name: str, language: str | None = None):
        raise NotImplementedError

    def get_language(self):
        return self.language

    def set_language(self, language: str):
        self.language = language


class LocalTranscriber(Transcriber):
    # Maybe I should turn this into into a type safe class

    def __init__(self, model_size="large-v3", language: str | None = None):
        self.model = None
        self.model_size = model_size
        self.status: Literal["offline", "online"] = "offline"
        self.language = language
        logger.info(f"Using Whisper Model: {model_size}")
        super().__init__()

    def load_model(self):
        self.model = WhisperModel(model_size_or_path=self.model_size)
        self.status = "online"
        logger.info("Whisper Model loaded into memory")

    def get_status(self):
        # logger.info(f"Whisper Model status: {self.status}")
        return self.status

    def transcribe_audio(
        self,
        file_name: str,
    ):
        if self.language == "auto":
            self.language = None
        if not self.model:
            raise ModelNotLoadedException()
        with open(file_name, "rb") as file:
            logger.info(
                f"Transcribing {file_name} using Local Whisper Model, language: {self.language}"
            )
            segments, info = self.model.transcribe(
                file,
                beam_size=5,
                temperature=0,
                language=self.language,
                vad_filter=True,
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


if __name__ == "__main__":
    transcriber = LocalTranscriber()
    transcriber.load_model()
