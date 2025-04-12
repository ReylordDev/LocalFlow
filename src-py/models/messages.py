import time
from typing import (
    Any,
    Annotated,
    List,
    Literal,
    Union,
)
from pydantic import BaseModel, Field
from models.commands import Action, ChannelResponseType, CHANNELS
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
    Literal["init", "recording", "compression", "transcription"],
    Action,
]


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float = Field(default_factory=time.time)
    updateKind: Literal["progress"] = "progress"


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float = Field(default_factory=time.time)
    updateKind: Literal["exception"] = "exception"


class TranscriptionMessage(BaseModel):
    transcription: str
    updateKind: Literal["transcription"] = "transcription"


class AudioLevelMessage(BaseModel):
    audio_level: float
    updateKind: Literal["audio_level"] = "audio_level"


class ErrorMessage(BaseModel):
    error: str
    updateKind: Literal["error"] = "error"


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
    updateKind: Literal["devices"] = "devices"


class ModesMessage(BaseModel):
    modes: List[Mode]
    updateKind: Literal["modes"] = "modes"


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
    updateKind: Literal["status"] = "status"


class ResultMessage(BaseModel):
    result: Result
    updateKind: Literal["result"] = "result"


class ResultsMessage(BaseModel):
    results: list[Result]
    updateKind: Literal["results"] = "results"


class VoiceModelsMessage(BaseModel):
    voice_models: list[VoiceModel]
    updateKind: Literal["voice_models"] = "voice_models"


class LanguageModelsMessage(BaseModel):
    language_models: list[LanguageModel]
    updateKind: Literal["language_models"] = "language_models"


class TextReplacementsMessage(BaseModel):
    text_replacements: List[TextReplacement]
    updateKind: Literal["text_replacements"] = "text_replacements"


# Create discriminated union for MessageType
MessageType = Annotated[
    Union[
        ProgressMessage,
        ExceptionMessage,
        AudioLevelMessage,
        ErrorMessage,
        StatusMessage,
        ResultMessage,
        TranscriptionMessage,
        DevicesMessage,
        ModesMessage,
        ResultsMessage,
        VoiceModelsMessage,
        LanguageModelsMessage,
        TextReplacementsMessage,
    ],
    Field(discriminator="updateKind"),
]


# For response types related to specific channels
class BaseResponse(BaseModel):
    data: Any
    channel: CHANNELS
    id: str
    kind: Literal["response"] = "response"


class ModesResponse(BaseResponse):
    data: list[Mode]
    channel: Literal[CHANNELS.FETCH_ALL_MODES] = CHANNELS.FETCH_ALL_MODES


class ResultsResponse(BaseResponse):
    data: list[Result]
    channel: Literal[CHANNELS.FETCH_ALL_RESULTS] = CHANNELS.FETCH_ALL_RESULTS


class TextReplacementsResponse(BaseResponse):
    data: list[TextReplacement]
    channel: Literal[CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS] = (
        CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS
    )


class DevicesResponse(BaseResponse):
    data: list[Device]
    channel: Literal[CHANNELS.FETCH_ALL_DEVICES] = CHANNELS.FETCH_ALL_DEVICES


class VoiceModelsResponse(BaseResponse):
    data: list[VoiceModel]
    channel: Literal[CHANNELS.FETCH_ALL_VOICE_MODELS] = CHANNELS.FETCH_ALL_VOICE_MODELS


class LanguageModelsResponse(BaseResponse):
    data: list[LanguageModel]
    channel: Literal[CHANNELS.FETCH_ALL_LANGUAGE_MODELS] = (
        CHANNELS.FETCH_ALL_LANGUAGE_MODELS
    )


# To match TypeScript Update = MessageType & { kind: "update" }
# We need to use composition rather than having MessageType in a data property
class ProgressUpdate(ProgressMessage):
    kind: Literal["update"] = "update"


class ExceptionUpdate(ExceptionMessage):
    kind: Literal["update"] = "update"


class AudioLevelUpdate(AudioLevelMessage):
    kind: Literal["update"] = "update"


class ErrorUpdate(ErrorMessage):
    kind: Literal["update"] = "update"


class StatusUpdate(StatusMessage):
    kind: Literal["update"] = "update"


class ResultUpdate(ResultMessage):
    kind: Literal["update"] = "update"


class TranscriptionUpdate(TranscriptionMessage):
    kind: Literal["update"] = "update"


# Create discriminated union for Update type
UpdateMessage = Annotated[
    Union[
        ProgressUpdate,
        ExceptionUpdate,
        AudioLevelUpdate,
        ErrorUpdate,
        StatusUpdate,
        ResultUpdate,
        TranscriptionUpdate,
    ],
    Field(discriminator="updateKind"),
]


# Final Message Union type
Message = Annotated[
    Union[BaseResponse, UpdateMessage],
    Field(discriminator="kind"),
]
