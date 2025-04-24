import time
from typing import (
    Any,
    Annotated,
    Literal,
    Union,
)
from pydantic import BaseModel, Field
from models.commands import Action
from models.channels import CHANNELS
from models.db import (
    Device,
    LanguageModel,
    Mode,
    Result,
    TextReplacement,
    VoiceModel,
)

# ---------- Update Message ----------

# Utility types
StatusType = Literal["start", "complete", "error"]
StepType = Union[
    Literal["init", "recording", "compression", "transcription"],
    Action,
]


class BaseUpdateMessage(BaseModel):
    kind: Literal["update"] = "update"


class ProgressMessage(BaseUpdateMessage):
    step: StepType
    status: StatusType
    timestamp: float = Field(default_factory=time.time)
    updateKind: Literal["progress"] = "progress"


class ExceptionMessage(BaseUpdateMessage):
    exception: str
    timestamp: float = Field(default_factory=time.time)
    updateKind: Literal["exception"] = "exception"


class AudioLevelMessage(BaseUpdateMessage):
    audio_level: float
    updateKind: Literal["audio_level"] = "audio_level"


class ErrorMessage(BaseModel):
    error: str
    updateKind: Literal["error"] = "error"


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


class StatusMessage(BaseUpdateMessage):
    status: ControllerStatusType
    updateKind: Literal["status"] = "status"


class ResultMessage(BaseUpdateMessage):
    result: Result
    updateKind: Literal["result"] = "result"


class TranscriptionMessage(BaseUpdateMessage):
    transcription: str
    updateKind: Literal["transcription"] = "transcription"


# A message from the Python process to the Electron process that was not explicitly requested.
Update = Annotated[
    Union[
        ProgressMessage,
        ExceptionMessage,
        AudioLevelMessage,
        ErrorMessage,
        StatusMessage,
        ResultMessage,
        TranscriptionMessage,
    ],
    Field(discriminator="updateKind"),
]


# ---------- Response Message ----------


class BaseResponse(BaseModel):
    """
    Base class for a response from the Python process to the Electron process that was explicitly requested.
    """

    data: Any  # data type depends on the channel, refer to awaited return types of PythonChannelMap in channels.ts. Subtypes implement tighter types.
    channel: CHANNELS
    id: str
    kind: Literal["response"] = "response"


# TODO: investigate the need for the channel field


class ModesResponse(BaseResponse):
    data: list[Mode]
    channel: Literal[CHANNELS.FETCH_ALL_MODES] = CHANNELS.FETCH_ALL_MODES


class ModeResponse(BaseResponse):
    data: Mode
    channel: Literal[CHANNELS.CREATE_MODE] = CHANNELS.CREATE_MODE


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


# ------- Message -------

# A message from the Python process to the Electron process.
Message = Annotated[
    Union[BaseResponse, Update],
    Field(discriminator="kind"),
]
