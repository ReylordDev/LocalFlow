from groq import Groq
from loguru import logger
from faster_whisper import WhisperModel
from dotenv import load_dotenv
import os

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


class Transcriber:
    def __init__(self, input_dir):
        self.input_dir = input_dir

    def transcribe_audio(self, file_name: str):
        raise NotImplementedError

    def transcribe_files(self):
        file_names = os.listdir(self.input_dir)
        file_names.sort(key=lambda x: int(x.split(".")[0]))
        complete_transcription: list[str] = []
        for file_name in file_names:
            if not file_name.endswith(".flac"):
                continue
            transcription = self.transcribe_audio(
                os.path.join(self.input_dir, file_name)
            )
            complete_transcription.append(transcription)
        transcription = " ".join(complete_transcription)
        # Testing encoding
        with open(os.path.join(self.input_dir, "transcription.txt"), "w") as file:
            file.write(transcription)
            file.write("\n" + transcription.encode("utf-8").hex())
            file.write("\n" + transcription.encode("utf-8").decode("utf-8"))
            file.write("\n" + transcription.encode("cp1252").hex())
            file.write("\n" + transcription.encode("cp1252").decode("cp1252"))
        return transcription


class GroqTranscriber(Transcriber):
    def __init__(self, input_dir):
        load_dotenv()

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        assert GROQ_API_KEY, "GROQ_API_KEY not found in .env"

        self.client = Groq(api_key=GROQ_API_KEY)
        super().__init__(input_dir)

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
    def __init__(self, input_dir, model_size="distil-large-v3"):
        self.model = WhisperModel(model_size, device="cuda", compute_type="int8")
        logger.info(f"Local Whisper Model {model_size} loaded")
        super().__init__(input_dir)

    def transcribe_audio(self, file_name: str):
        with open(file_name, "rb") as file:
            logger.info(f"Transcribing {file_name} using Local Whisper Model")
            segments, info = self.model.transcribe(file, beam_size=5, temperature=0)
            logger.debug(
                f"Language: {info.language} ({info.language_probability * 100 :.2f}%)"
            )
            transcription = ""
            for segment in segments:
                transcription += segment.text
            logger.info(f'Transcription: "{transcription}"')
            return transcription
