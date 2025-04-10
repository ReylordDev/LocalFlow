import sys
from time import time
from typing import Any, Dict
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


def print_progress(step: StepType, status: StatusType, timestamp=time()):
    """Print a progress message to stdout for IPC

    Args:
        step: The step being processed (e.g., "init", "recording", "compressing")
        status: The status of the step (e.g., "start", "complete", "error")
        timestamp: Optional timestamp for the progress message
    """
    progress_message = Message(
        type="progress",
        data=ProgressMessage(step=step, status=status, timestamp=timestamp),
    )
    print(progress_message.model_dump_json())
    logger.info(f"Progress: {step} - {status}")
    sys.stdout.flush()


def print_message(type_name: MessageType, message_data: MessageDataType):
    """Print a message to stdout for IPC

    Args:
        type_name: The type of message
        message_data: The message data
    """
    message = Message(type=type_name, data=message_data).model_dump_json()
    logger.debug(message)
    print(message, flush=True)


def print_nested_model(type: MessageType, data: dict):
    """
    Print a nested model (with existing serialized objects) as a message

    This is useful when we have objects that have already been serialized
    with dump_instance or similar functions. It allows us to skip extra serialization
    steps.

    Args:
        type_name: The type of message
        data: Dictionary containing already serialized data
    """
    model_str = to_json({"type": type, "data": data}).decode("utf-8")
    logger.debug(model_str)
    print(model_str, flush=True)
