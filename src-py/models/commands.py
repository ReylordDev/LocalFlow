from enum import Enum
from typing import Any, Literal, Union, Annotated
from uuid import UUID
from pydantic import BaseModel, Field
from models.db import (
    ExampleBase,
    ModeCreate,
    ModeUpdate,
    TextReplacementBase,
    Device,
)
from models.channels import CHANNELS

# ---------- Requests ----------


class BaseRequest(BaseModel):
    channel: CHANNELS
    data: Any  # data type depends on the channel, refer to parameters of PythonChannelMap in channels.ts. Subtypes implement tighter types.
    id: str
    kind: Literal["request"] = "request"


class AddExampleParameter(BaseModel):
    prompt_id: UUID
    example: ExampleBase


# Channel-specific request models with discriminator
class FetchAllModesRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_MODES] = CHANNELS.FETCH_ALL_MODES
    data: None = None


class CreateModeRequest(BaseRequest):
    channel: Literal[CHANNELS.CREATE_MODE] = CHANNELS.CREATE_MODE
    data: ModeCreate


class UpdateModeRequest(BaseRequest):
    channel: Literal[CHANNELS.UPDATE_MODE] = CHANNELS.UPDATE_MODE
    data: ModeUpdate


class DeleteModeRequest(BaseRequest):
    channel: Literal[CHANNELS.DELETE_MODE] = CHANNELS.DELETE_MODE
    data: UUID


class ActivateModeRequest(BaseRequest):
    channel: Literal[CHANNELS.ACTIVATE_MODE] = CHANNELS.ACTIVATE_MODE
    data: UUID


class DeleteResultRequest(BaseRequest):
    channel: Literal[CHANNELS.DELETE_RESULT] = CHANNELS.DELETE_RESULT
    data: UUID


class AddExampleRequest(BaseRequest):
    channel: Literal[CHANNELS.ADD_EXAMPLE] = CHANNELS.ADD_EXAMPLE
    data: AddExampleParameter


class FetchAllResultsRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_RESULTS] = CHANNELS.FETCH_ALL_RESULTS
    data: None = None


class FetchAllVoiceModelsRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_VOICE_MODELS] = CHANNELS.FETCH_ALL_VOICE_MODELS
    data: None = None


class FetchAllLanguageModelsRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_LANGUAGE_MODELS] = (
        CHANNELS.FETCH_ALL_LANGUAGE_MODELS
    )
    data: None = None


class FetchAllTextReplacementsRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS] = (
        CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS
    )
    data: None = None


class CreateTextReplacementRequest(BaseRequest):
    channel: Literal[CHANNELS.CREATE_TEXT_REPLACEMENT] = (
        CHANNELS.CREATE_TEXT_REPLACEMENT
    )
    data: TextReplacementBase


class DeleteTextReplacementRequest(BaseRequest):
    channel: Literal[CHANNELS.DELETE_TEXT_REPLACEMENT] = (
        CHANNELS.DELETE_TEXT_REPLACEMENT
    )
    data: UUID


class FetchAllDevicesRequest(BaseRequest):
    channel: Literal[CHANNELS.FETCH_ALL_DEVICES] = CHANNELS.FETCH_ALL_DEVICES
    data: None = None


class SetDeviceRequest(BaseRequest):
    channel: Literal[CHANNELS.SET_DEVICE] = CHANNELS.SET_DEVICE
    data: Device


# A request from the Electron process that expects a response
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


# ---------- Responseless Commands  ----------


# Update Action Literal to match TypeScript enum
class Action(str, Enum):
    TOGGLE = "toggle"
    CANCEL = "cancel"
    AUDIO_LEVEL = "audio_level"


# TODO: Maybe there is a way to do an actual type mapping
ActionDataMap = {
    Action.TOGGLE: None,
    Action.CANCEL: None,
    Action.AUDIO_LEVEL: None,
}


class BaseResponselessCommand(BaseModel):
    action: Action
    kind: Literal["command"] = "command"


class ToggleCommand(BaseResponselessCommand):
    action: Literal[Action.TOGGLE] = Action.TOGGLE
    data: None = None


class CancelCommand(BaseResponselessCommand):
    action: Literal[Action.CANCEL] = Action.CANCEL
    data: None = None


class AudioLevelCommand(BaseResponselessCommand):
    action: Literal[Action.AUDIO_LEVEL] = Action.AUDIO_LEVEL
    data: None = None


# A command from the electron process that doesn't expect a response
ResponselessCommand = Annotated[
    Union[
        ToggleCommand,
        CancelCommand,
        AudioLevelCommand,
    ],
    Field(discriminator="action"),
]


# Final Command Union type
CommandType = Annotated[
    Union[Request, ResponselessCommand], Field(discriminator="kind")
]


class ElectronCommand(BaseModel):
    """
    Parent type for any message sent from the Electron process.
    """

    command: CommandType
