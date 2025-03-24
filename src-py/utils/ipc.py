from loguru import logger
from sqlmodel import SQLModel
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


def print_message2(type: MessageType, data: dict):
    message = Message(type=type, data=data)
    logger.debug(message)
    print(
        message.model_dump_json(serialize_as_any=True, indent=2),
        flush=True,
    )


def print_message(type: MessageType, data: MessageDataType):
    message = Message(type=type, data=data).model_dump_json(
        serialize_as_any=True, indent=2
    )
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
