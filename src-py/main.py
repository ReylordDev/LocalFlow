#!/usr/bin/env python3
import sys
from loguru import logger

# Initialize logger
from utils.logging import initialize_logger

initialize_logger()

# Import components
from models.commands import ElectronCommand
from core.controller import Controller  # noqa: E402


def main():
    """
    The main entry point for the application.
    Sets up the controller and handles command input from stdin.
    """
    try:
        logger.info("Starting LocalFlow Python backend")
        controller = Controller()

        for line in sys.stdin:
            try:
                # Parse the command from stdin
                logger.debug(f"Received line: {line.strip()}")
                command = ElectronCommand.model_validate_json(line.strip())

                # Process the command
                controller.handle_command(command)
            except Exception as e:
                logger.error(f"Error handling command: {e}")
                logger.exception(e)
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        logger.exception(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
