import sys
from pydantic import ValidationError
from loguru import logger
from core.controller import Controller
from models.commands import Command
from api.ipc import print_message
from models.messages import ErrorUpdate
from utils.logging import initialize_logger


@logger.catch
def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = sys.stdin.readline()
        try:
            data = Command.model_validate_json(message)
            controller.handle_command(data)
        except ValidationError as e:
            logger.error(f"Invalid data: {e}")
            print_message(ErrorUpdate(error="Invalid Data"))
            sys.stdout.flush()


if __name__ == "__main__":
    main()
