import time
from typing import Literal, Optional, Union
from uuid import uuid4
from pydantic import BaseModel
from sqlmodel import UUID, Field, SQLModel


StatusType = Literal["start", "complete", "error"]
ActionType = Literal[
    "start",
    "stop",
    "reset",
    "audio_level",
    "quit",
    "model_status",
    "model_load",
    "get_history",
    "delete_transcription",
    "set_language",
    "get_devices",
    "set_device",
]
StepType = Union[
    ActionType,
    Literal[
        "init",
        "recording",
        "compression",
        "transcription",
        "formatting",
        "committing_to_history",
        "loading_transcriber",
        "loading_formatter",
    ],
]


class Command(BaseModel):
    action: ActionType
    data: Optional[dict] = None


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float


class RawTranscription(BaseModel):
    transcription: str


class FormattedTranscription(BaseModel):
    formatted_transcription: str


class ModelStatus(BaseModel):
    transcriber_status: Literal["offline", "online"]
    formatter_status: Literal["offline", "online"]


class AudioLevel(BaseModel):
    audio_level: float


class HistoryItem(BaseModel):
    id: int
    raw_transcription: str
    formatted_transcription: str
    created_at: str


class History(BaseModel):
    transcriptions: list[HistoryItem]


class Error(BaseModel):
    error: str


class Device(BaseModel):
    name: str
    index: int
    default_samplerate: float


class Devices(BaseModel):
    devices: list[Device]


MessageType = Literal[
    "audio_level",
    "progress",
    "raw_transcription",
    "formatted_transcription",
    "exception",
    "model_status",
    "history",
    "error",
    "devices",
]
MessageDataType = Union[
    ProgressMessage,
    RawTranscription,
    FormattedTranscription,
    AudioLevel,
    ExceptionMessage,
    ModelStatus,
    History,
    Devices,
    Error,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType


class ModelNotLoadedException(Exception):
    def __init__(self, message="Model not loaded"):
        self.message = ExceptionMessage(exception=message, timestamp=time.time())
        super().__init__(self.message.model_dump_json())


class OllamaOfflineException(Exception):
    def __init__(self, message="Ollama is not running"):
        self.message = ExceptionMessage(exception=message, timestamp=time.time())
        super().__init__(self.message.model_dump_json())


class ApplicationContext(BaseModel):
    name: str
    title: str


class ActiveWindowContext(BaseModel):
    title: str
    process: str
    platform: Literal["windows", "darwin", "linux"]
    app_name: str


##################

# TODO: Check that this is correct
type LanguageType = Literal["auto", "en", "de", "fr", "it", "es", "pt", "hi", "th"]

language_name_map: dict[LanguageType, str] = {
    "auto": "Auto",
    "en": "English",
    "de": "German",
    "fr": "French",
    "it": "Italian",
    "es": "Spanish",
    "pt": "Portuguese",
    "hi": "Hindi",
    "th": "Thai",
}


class Mode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str

    text_replacements: list["TextReplacement"] = []  # add relationship

    voice_model: "VoiceModel"  # add relationship
    voice_language: LanguageType
    translate_to_english: bool = False

    use_language_model: bool = False
    language_model: (
        "LanguageModel | None"  # add relationship, TODO: Check that this is correct
    )
    prompt: "Prompt"  # add relationship

    record_system_audio: bool = False


class VoiceModel(SQLModel, table=True):
    name: str = Field(primary_key=True)  # Replace type with compatible models
    language: Literal["english-only", "multilingual"]
    speed: int
    accuracy: int
    size: int
    parameters: int


class LanguageModel(SQLModel, table=True):
    pass


class Prompt(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    system_prompt: str
    examples: list["Example"] = []  # add relationship

    include_clipboard: bool = False
    include_active_window: bool = False  # TODO: research


class Example(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    input: str
    output: str


class TextReplacement(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    original_text: str
    replacement_text: str
    # It should be optional to link a text replacement to a mode
