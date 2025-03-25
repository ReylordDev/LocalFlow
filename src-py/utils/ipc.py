from loguru import logger
from models import (
    ProgressMessage,
    Message,
    StepType,
    StatusType,
    MessageType,
    MessageDataType,
)
import sys
import time
from pydantic_core import to_json


def print_nested_model(type: MessageType, data: dict):
    model_str = to_json({"type": type, "data": data}).decode("utf-8")
    logger.debug(model_str)
    print(model_str, flush=True)


def print_message(type: MessageType, data: MessageDataType):
    message = Message(type=type, data=data).model_dump_json()
    logger.debug(message)
    print(message, flush=True)


def print_progress(
    step: StepType,
    status: StatusType,
):
    progress_message = Message(
        type="progress",
        data=ProgressMessage(step=step, status=status, timestamp=time.time()),
    )
    print(progress_message.model_dump_json())
    logger.info(f"Progress: {step} - {status}")
    sys.stdout.flush()
