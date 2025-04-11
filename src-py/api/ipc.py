import json
import sys
from time import time
from pydantic_core import to_json

from loguru import logger
from models.messages import (
    MessageDataType,
    MessageType,
    ProgressMessage,
    Message,
    StatusType,
    StepType,
)


def print_progress(
    step: StepType, status: StatusType, timestamp=time(), request_id: str | None = None
):
    """Print a progress message to stdout for IPC

    Args:
        step: The step being processed (e.g., "init", "recording", "compressing")
        status: The status of the step (e.g., "start", "complete", "error")
        timestamp: Optional timestamp for the progress message
        request_id: Optional request ID for the progress message
    """
    progress_message = ProgressMessage(step=step, status=status, timestamp=timestamp)
    print_message("progress", progress_message, request_id)


def print_message(
    type_name: MessageType, message_data: MessageDataType, request_id: str | None = None
):
    """Print a message to stdout for IPC

    Args:
        type_name: The type of message
        message_data: The message data
        request_id: Optional request ID for the message
    """
    message = Message(
        type=type_name, data=message_data, request_id=request_id
    ).model_dump_json()
    logger.debug(message)
    print(message, flush=True)


def print_nested_model(
    type_name: MessageType, data: dict, request_id: str | None = None
):
    """
    Print a nested model (with existing serialized objects) as a message

    This is useful when we have objects that have already been serialized
    with dump_instance or similar functions. It allows us to skip extra serialization
    steps.

    Args:
        type_name: The type of message
        data: Dictionary containing already serialized data
        request_id: Optional request ID for the message
    """
    model_str = to_json(
        {"type": type_name, "data": data, "request_id": request_id}
    ).decode("utf-8")
    logger.debug(model_str)
    print(model_str, flush=True)
