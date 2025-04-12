from typing import Literal, Optional, Union, Annotated
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum
from models.db import (
    ExampleBase,
    LanguageModel,
    Mode,
    ModeCreate,
    ModeUpdate,
    Result,
    TextReplacement,
    TextReplacementBase,
    VoiceModel,
)


# maybe move somewhere else
class Device(BaseModel):
    name: str
    index: int
    default_samplerate: float
    is_default: bool = False


# Update Action Literal to match TypeScript enum
Action = Literal[
    "toggle",
    "cancel",
    "audio_level",
    "switch_mode",
]


# ChannelType Literal to match TypeScript enum
class CHANNELS(str, Enum):
    FETCH_ALL_MODES = "database:modes:getAll"
    CREATE_MODE = "database:modes:createMode"
    UPDATE_MODE = "database:modes:updateMode"
    DELETE_MODE = "database:modes:deleteMode"
    ACTIVATE_MODE = "database:modes:activateMode"
    DELETE_RESULT = "database:results:deleteResult"
    ADD_EXAMPLE = "database:examples:addExample"
    FETCH_ALL_RESULTS = "database:results:getAll"
    FETCH_ALL_VOICE_MODELS = "database:voiceModels:getAll"
    FETCH_ALL_LANGUAGE_MODELS = "database:languageModels:getAll"
    FETCH_ALL_TEXT_REPLACEMENTS = "database:textReplacements:getAll"
    CREATE_TEXT_REPLACEMENT = "database:textReplacements:create"
    DELETE_TEXT_REPLACEMENT = "database:textReplacements:delete"
    FETCH_ALL_DEVICES = "device:getAll"
    SET_DEVICE = "device:set"


ChannelResponseType = {
    CHANNELS.FETCH_ALL_MODES: list[Mode],
    CHANNELS.CREATE_MODE: list[Mode],
    CHANNELS.UPDATE_MODE: list[Mode],
    CHANNELS.DELETE_MODE: list[Mode],
    CHANNELS.ACTIVATE_MODE: list[Mode],
    CHANNELS.DELETE_RESULT: list[Result],
    CHANNELS.ADD_EXAMPLE: None,
    CHANNELS.FETCH_ALL_RESULTS: list[Result],
    CHANNELS.FETCH_ALL_VOICE_MODELS: list[VoiceModel],
    CHANNELS.FETCH_ALL_LANGUAGE_MODELS: list[LanguageModel],
    CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS: list[TextReplacement],
    CHANNELS.CREATE_TEXT_REPLACEMENT: list[TextReplacement],
    CHANNELS.DELETE_TEXT_REPLACEMENT: list[TextReplacement],
    CHANNELS.FETCH_ALL_DEVICES: list[Device],
    CHANNELS.SET_DEVICE: Device,
}


class AddExampleData(BaseModel):
    prompt_id: UUID
    example: ExampleBase


# Base Request Models
class BaseRequest(BaseModel):
    channel: CHANNELS
    id: str
    kind: Literal["request"] = "request"


# Channel-specific request models with discriminator
class FetchAllModesRequest(BaseRequest):
    channel: Literal["database:modes:getAll"]
    data: None = None


class CreateModeRequest(BaseRequest):
    channel: Literal["database:modes:createMode"]
    data: ModeCreate


class UpdateModeRequest(BaseRequest):
    channel: Literal["database:modes:updateMode"]
    data: ModeUpdate


class DeleteModeRequest(BaseRequest):
    channel: Literal["database:modes:deleteMode"]
    data: UUID


class ActivateModeRequest(BaseRequest):
    channel: Literal["database:modes:activateMode"]
    data: UUID


class DeleteResultRequest(BaseRequest):
    channel: Literal["database:results:deleteResult"]
    data: UUID


class AddExampleRequest(BaseRequest):
    channel: Literal["database:examples:addExample"]
    data: AddExampleData


class FetchAllResultsRequest(BaseRequest):
    channel: Literal["database:results:getAll"]
    data: None = None


class FetchAllVoiceModelsRequest(BaseRequest):
    channel: Literal["database:voiceModels:getAll"]
    data: None = None


class FetchAllLanguageModelsRequest(BaseRequest):
    channel: Literal["database:languageModels:getAll"]
    data: None = None


class FetchAllTextReplacementsRequest(BaseRequest):
    channel: Literal["database:textReplacements:getAll"]
    data: None = None


class CreateTextReplacementRequest(BaseRequest):
    channel: Literal["database:textReplacements:create"]
    data: TextReplacementBase


class DeleteTextReplacementRequest(BaseRequest):
    channel: Literal["database:textReplacements:delete"]
    data: UUID


class FetchAllDevicesRequest(BaseRequest):
    channel: Literal["device:getAll"]
    data: None = None


class SetDeviceRequest(BaseRequest):
    channel: Literal["device:set"]
    data: Device


# Create discriminated union for Request
Request = Annotated[
    Union[
        FetchAllModesRequest,
        CreateModeRequest,
        UpdateModeRequest,
        DeleteModeRequest,
        ActivateModeRequest,
        DeleteResultRequest,
        AddExampleRequest,
        FetchAllResultsRequest,
        FetchAllVoiceModelsRequest,
        FetchAllLanguageModelsRequest,
        FetchAllTextReplacementsRequest,
        CreateTextReplacementRequest,
        DeleteTextReplacementRequest,
        FetchAllDevicesRequest,
        SetDeviceRequest,
    ],
    Field(discriminator="channel"),
]


class SelectDeviceCommand(BaseModel):
    index: int


class AddExampleCommand(BaseModel):
    prompt_id: UUID
    example: ExampleBase


class CreateTextReplacementCommand(BaseModel):
    text_replacement: TextReplacementBase


# Update CommandDataType to include only what's in ActionDataMap from TypeScript
CommandDataType = Union[
    UUID,  # For switch_mode
    None,  # For toggle, cancel, audio_level
]


class BaseResponselessCommand(BaseModel):
    kind: Literal["command"] = "command"


# ResponselessCommand models with discriminator
class ToggleCommand(BaseResponselessCommand):
    action: Literal["toggle"]
    data: None = None
    request_id: Optional[str] = None


class CancelCommand(BaseResponselessCommand):
    action: Literal["cancel"]
    data: None = None
    request_id: Optional[str] = None


class AudioLevelCommand(BaseResponselessCommand):
    action: Literal["audio_level"]
    data: None = None
    request_id: Optional[str] = None


class SwitchModeCommand(BaseResponselessCommand):
    action: Literal["switch_mode"]
    data: UUID
    request_id: Optional[str] = None


# Create discriminated union for ResponselessCommand
ResponselessCommand = Annotated[
    Union[
        ToggleCommand,
        CancelCommand,
        AudioLevelCommand,
        SwitchModeCommand,
    ],
    Field(discriminator="action"),
]


# Final Command Union type
CommandType = Annotated[
    Union[Request, ResponselessCommand], Field(discriminator="kind")
]


class Command(BaseModel):
    command: CommandType
