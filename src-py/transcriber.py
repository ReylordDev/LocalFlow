from groq import Groq
from loguru import logger
from faster_whisper import WhisperModel
from dotenv import load_dotenv
from models import ModelNotLoadedException
import os

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


class Transcriber:
    def __init__(self, language: str | None = None):
        self.language = language
        pass

    def transcribe_audio(self, file_name: str, language: str | None = None):
        raise NotImplementedError

    def transcribe_files(self, input_dir):
        file_names = os.listdir(input_dir)
        file_names = [
            file_name for file_name in file_names if file_name.endswith(".flac")
        ]
        file_names.sort(key=lambda x: int(x.split(".")[0]))
        complete_transcription: list[str] = []
        for file_name in file_names:
            transcription = self.transcribe_audio(
                os.path.join(input_dir, file_name), language=self.language
            )
            complete_transcription.append(transcription)
        transcription = " ".join(complete_transcription)
        # Testing encoding
        with open(os.path.join(input_dir, "transcription.txt"), "w") as file:
            file.write(transcription)
            file.write("\n" + transcription.encode("utf-8").hex())
            file.write("\n" + transcription.encode("utf-8").decode("utf-8"))
            file.write("\n" + transcription.encode("cp1252").hex())
            file.write("\n" + transcription.encode("cp1252").decode("cp1252"))
        return transcription

    def get_language(self):
        return self.language

    def set_language(self, language: str):
        self.language = language


# I want to work on the local one first, it's okay if the groq one doesn't work for now
class GroqTranscriber(Transcriber):
    def __init__(self):
        load_dotenv()

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        assert GROQ_API_KEY, "GROQ_API_KEY not found in .env"

        self.client = Groq(api_key=GROQ_API_KEY)
        super().__init__()

    def transcribe_audio(self, file_name: str):
        with open(file_name, "rb") as file:
            logger.info(f"Transcribing {file_name} using Groq API")
            transcription = self.client.audio.transcriptions.create(
                file=(file_name, file.read()),
                model="whisper-large-v3",
                response_format="json",  # Optional
                temperature=0.0,
            )
            logger.info(f'Transcription: "{transcription.text}"')
            return transcription.text


class LocalTranscriber(Transcriber):
    # Maybe I should turn this into into a type safe class

    def __init__(self, model_size="distil-large-v3", language: str | None = None):
        self.model = None
        self.model_size = model_size
        self.status = "offline"
        self.language = language
        logger.info(f"Using Whisper Model: {model_size}")
        super().__init__()

    def load_model(self):
        self.model = WhisperModel(model_size_or_path=self.model_size)
        self.status = "online"
        logger.info("Whisper Model loaded into memory")
        # How can I check if the model is loaded?

    def unload_model(self):
        # Unsure if this actually works. Let's investigate
        if self.model:
            del self.model
            self.model = None
            self.status = "offline"
            logger.info("Whisper Model unloaded from memory")

    def get_status(self):
        # logger.info(f"Whisper Model status: {self.status}")
        return self.status

    def transcribe_audio(self, file_name: str, language: str | None = None):
        if not self.model:
            raise ModelNotLoadedException()
        with open(file_name, "rb") as file:
            logger.info(
                f"Transcribing {file_name} using Local Whisper Model, language: {language}"
            )
            segments, info = self.model.transcribe(
                file, beam_size=5, temperature=0, language=language, task="transcribe"
            )
            logger.debug(
                f"Language: {info.language} ({info.language_probability * 100:.2f}%)"
            )
            transcription = ""
            for segment in segments:
                transcription += segment.text
            logger.info(f'Transcription: "{transcription}"')
            return transcription
