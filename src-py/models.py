import abc
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
    "toggle",
    "cancel",
    "reset",
    "audio_level",
    "select_mode",
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
    ],
]


### Electron -> Python IPC


class SelectModeCommand(BaseModel):
    mode_id: UUID


class SelectDeviceCommand(BaseModel):
    index: int


class Command(BaseModel):
    action: ActionType
    data: SelectModeCommand | SelectDeviceCommand | None = None


#########################


### Python -> Electron IPC


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float


class TranscriptionMessage(BaseModel):
    transcription: str


class LanguageModelTranscriptionMessage(BaseModel):
    formatted_transcription: str


class AudioLevelMessage(BaseModel):
    audio_level: float


class ErrorMessage(BaseModel):
    error: str


class Device(BaseModel):
    name: str
    index: int
    default_samplerate: float


class DevicesMessage(BaseModel):
    devices: list[Device]


ControllerStatusType = Literal[
    "idle",
    "recording",
    "compressing",
    "loading_voice_model",
    "transcribing",
    "loading_language_model",
    "generating_ai_result",
    "saving",
    "result",
]


class StatusMessage(BaseModel):
    status: ControllerStatusType


MessageType = Literal[
    "progress",
    "transcription",
    "formatted_transcription",
    "audio_level",
    "exception",
    "devices",
    "error",
    "status",
]

MessageDataType = Union[
    ProgressMessage,
    TranscriptionMessage,
    LanguageModelTranscriptionMessage,
    AudioLevelMessage,
    ExceptionMessage,
    DevicesMessage,
    ErrorMessage,
    StatusMessage,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType


#################


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
LanguageType = Literal["auto", "en", "de", "fr", "it", "es", "pt", "hi", "th"]

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

VoiceModelNameType = Literal["large-v3-turbo", "large-v3", "distil-large-v3"]


class Mode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    default: bool = False
    active: bool = False

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


class VoiceModel(SQLModel, abc.ABC, table=True):
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

    mode_id: UUID | None = Field(foreign_key="mode.id")
    mode: Mode | None = Relationship(back_populates="text_replacements")


class Result(SQLModel, table=True):
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
