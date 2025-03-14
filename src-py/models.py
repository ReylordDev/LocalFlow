import os
import time
from typing import Literal, Optional, Union
from uuid import uuid4, UUID
from pydantic import BaseModel, computed_field
from sqlalchemy import String
from sqlmodel import Field, Relationship, SQLModel
from utils.utils import get_user_data_path


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

type VoiceModelNameType = Literal["large-v3-turbo", "large-v3", "distil-large-v3"]

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
    default: bool = False

    text_replacements: list["TextReplacement"] = Relationship(back_populates="mode")

    voice_model: "VoiceModel" = Relationship(back_populates="modes")
    voice_model_id: VoiceModelNameType = Field(
        foreign_key="voicemodel.name", sa_type=String
    )
    voice_language: LanguageType = Field(sa_type=String)
    translate_to_english: bool = False

    use_language_model: bool = False
    language_model: Optional["LanguageModel"] = Relationship(back_populates="modes")
    language_model_id: str | None = Field(
        foreign_key="languagemodel.name", default=None
    )
    prompt: Optional["Prompt"] = Relationship(back_populates="mode")

    record_system_audio: bool = False


class VoiceModel(SQLModel, table=True):
    name: VoiceModelNameType = Field(primary_key=True, sa_type=String)
    language: Literal["english-only", "multilingual"] = Field(sa_type=String)
    speed: int
    accuracy: int
    size: int
    parameters: int

    modes: list[Mode] = Relationship(back_populates="voice_model")


class LanguageModel(SQLModel, table=True):
    name: str = Field(primary_key=True)  # Replace type with compatible models

    modes: list[Mode] = Relationship(back_populates="language_model")


class Prompt(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    mode_id: UUID | None = Field(foreign_key="mode.id", default=None)
    mode: Mode | None = Relationship(back_populates="prompt")

    system_prompt: str
    examples: list["Example"] = Relationship(back_populates="prompt")

    include_clipboard: bool = False
    include_active_window: bool = False  # TODO: research


class Example(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    input: str
    output: str

    prompt_id: UUID = Field(foreign_key="prompt.id")
    prompt: Prompt = Relationship(back_populates="examples")


class TextReplacement(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    original_text: str
    replacement_text: str

    mode_id: UUID = Field(foreign_key="mode.id")
    mode: Mode | None = Relationship(back_populates="text_replacements")


class Recording(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    mode_id: UUID = Field(foreign_key="mode.id")
    created_at: float = Field(default_factory=time.time)
    transcription: str
    ai_result: str | None
    duration: float
    processing_time: float

    @computed_field
    @property
    def location(self) -> str:
        location = f"{get_user_data_path()}/results/{self.id}"
        os.makedirs(location, exist_ok=True)
        return location
