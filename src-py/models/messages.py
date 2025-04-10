import time
from typing import Any, List, Literal, Optional, Union
from pydantic import BaseModel, Field
from uuid import UUID


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
    "error",
]


class StatusMessage(BaseModel):
    status: ControllerStatusType


class ProgressMessage(BaseModel):
    step: str
    status: str
    timestamp: float = Field(default_factory=time.time)


class AudioLevelMessage(BaseModel):
    audio_level: float


class TranscriptionMessage(BaseModel):
    transcription: str


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float = Field(default_factory=time.time)


class Device(BaseModel):
    hostapi: int
    index: int
    max_input_channels: int
    max_output_channels: int
    name: str
    default_low_input_latency: float
    default_low_output_latency: float
    default_high_input_latency: float
    default_high_output_latency: float
    default_samplerate: float
    is_default: bool = False


class DevicesMessage(BaseModel):
    devices: List[Device]


class ErrorMessage(BaseModel):
    error: str


class VoiceModelMessage(BaseModel):
    voice_models: Any


class LanguageModelMessage(BaseModel):
    language_models: Any


MessageDataType = Union[
    StatusMessage,
    ProgressMessage,
    AudioLevelMessage,
    TranscriptionMessage,
    ExceptionMessage,
    DevicesMessage,
    ErrorMessage,
    VoiceModelMessage,
    LanguageModelMessage,
    dict,
]


class Message(BaseModel):
    """
    Base message model for IPC communication.

    This model defines the structure of messages sent between the frontend and backend.

    Attributes:
        type: The type of message
        data: The message data
    """

    type: str
    data: MessageDataType


MessageType = Literal[
    "progress",
    "transcription",
    "audio_level",
    "exception",
    "devices",
    "error",
    "status",
    "modes",
    "modes_update",
    "result",
    "results",
    "voice_models",
    "language_models",
    "text_replacements",
]

StatusType = Literal["start", "complete", "error"]
ActionType = Literal[
    "toggle",
    "cancel",
    "reset",
    "audio_level",
    "select_mode",
    "get_devices",
    "set_device",
    "get_modes",
    "create_mode",
    "update_mode",
    "delete_mode",
    "switch_mode",
    "get_results",
    "delete_result",
    "add_example",
    "get_voice_models",
    "get_language_models",
    "get_text_replacements",
    "create_text_replacement",
    "delete_text_replacement",
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
