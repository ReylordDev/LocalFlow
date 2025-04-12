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


class SelectDeviceCommand(BaseModel):
    index: int


class AddExampleCommand(BaseModel):
    prompt_id: UUID
    example: ExampleBase


class CreateTextReplacementCommand(BaseModel):
    text_replacement: TextReplacementBase


CommandDataType = Union[
    SelectDeviceCommand,
    ModeCreate,
    ModeUpdate,
    AddExampleCommand,
    CreateTextReplacementCommand,
    TextReplacementBase,
    UUID,
]


class Command(BaseModel):
    """
    Command model used for IPC between the frontend and backend.

    This model defines the structure of commands sent from the frontend to
    the backend for processing.

    Attributes:
        action: The action to be performed (e.g., "toggle", "cancel", etc.)
        data: Optional data associated with the command
        request_id: Optional unique identifier for tracking requests and responses
    """

    action: Action
    data: Optional[CommandDataType] = None
    request_id: Optional[str] = None
