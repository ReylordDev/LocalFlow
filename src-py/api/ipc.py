from time import time
from pydantic_core import to_json

from loguru import logger
from models.messages import (
    Message,
    ProgressMessage,
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
    print_message(
        message_data=progress_message,
    )


def print_message(
    message_data: Message,
):
    message = message_data.model_dump_json()
    logger.debug(message)
    print(message, flush=True)


def print_nested_model(data: dict):
    model_str = to_json(data).decode("utf-8")
    logger.debug(model_str)
    print(model_str, flush=True)
