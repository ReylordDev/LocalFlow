import time
from typing import Literal, Optional, Union
from pydantic import BaseModel


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
