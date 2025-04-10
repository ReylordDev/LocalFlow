from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel
from models.db import ExampleBase, ModeCreate, ModeUpdate, TextReplacementBase


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
    None,
    SelectModeCommand,
    SelectDeviceCommand,
    SelectResultCommand,
    SelectTextReplacementCommand,
    AddExampleCommand,
    ModeCreate,
    ModeUpdate,
    TextReplacementBase,
    str,
    dict,
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
