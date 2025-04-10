from typing import Literal, Optional, Union
from uuid import UUID
from pydantic import BaseModel
from models.db import ExampleBase, ModeCreate, ModeUpdate, TextReplacementBase

Action = Literal[
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


class SelectModeCommand(BaseModel):
    mode_id: UUID


class SelectDeviceCommand(BaseModel):
    index: int


class SelectResultCommand(BaseModel):
    result_id: UUID


class SelectTextReplacementCommand(BaseModel):
    text_replacement_id: UUID


class AddExampleCommand(BaseModel):
    prompt_id: UUID
    example: ExampleBase


CommandDataType = Union[
    SelectModeCommand,
    SelectDeviceCommand,
    SelectResultCommand,
    ModeCreate,
    ModeUpdate,
    AddExampleCommand,
    SelectTextReplacementCommand,
    TextReplacementBase,
]


class Command(BaseModel):
    """
    Command model used for IPC between the frontend and backend.

    This model defines the structure of commands sent from the frontend to
    the backend for processing.

    Attributes:
        action: The action to be performed (e.g., "toggle", "cancel", etc.)
        data: Optional data associated with the command
    """

    action: str
    data: Optional[CommandDataType] = None
