import time
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field
from models.commands import Action
from models.db import (
    LanguageModel,
    Mode,
    Result,
    TextReplacement,
    VoiceModel,
)

# Utility types
StatusType = Literal["start", "complete", "error"]
StepType = Union[
    Action,
    Literal[
        "init",
        "recording",
        "compression",
        "transcription",
    ],
]


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float = Field(default_factory=time.time)


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float = Field(default_factory=time.time)


class TranscriptionMessage(BaseModel):
    transcription: str


class AudioLevelMessage(BaseModel):
    audio_level: float


class ErrorMessage(BaseModel):
    error: str


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


class ModesMessage(BaseModel):
    modes: List[Mode]


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


class ResultMessage(BaseModel):
    result: Result


class ResultsMessage(BaseModel):
    results: list[Result]


class VoiceModelsMessage(BaseModel):
    voice_models: list[VoiceModel]


class LanguageModelsMessage(BaseModel):
    language_models: list[LanguageModel]


class TextReplacementsMessage(BaseModel):
    text_replacements: List[TextReplacement]


MessageDataType = Union[
    StatusMessage,
    ProgressMessage,
    AudioLevelMessage,
    TranscriptionMessage,
    ExceptionMessage,
    DevicesMessage,
    ErrorMessage,
    ModesMessage,
    ResultMessage,
    ResultsMessage,
    VoiceModelsMessage,
    LanguageModelsMessage,
    TextReplacementsMessage,
]


class Message(BaseModel):
    """
    Base message model for IPC communication.

    This model defines the structure of messages sent between the frontend and backend.

    Attributes:
        type: The type of message
        data: The message data
        request_id: Optional ID that links this message to a specific request
    """

    type: Optional[str] = None  # inaccurate, maybe combine with request_id
    data: MessageDataType  # inaccurate
    request_id: Optional[str] = None
