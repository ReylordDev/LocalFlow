#!/usr/bin/env python3
import json
import sys
from loguru import logger

# Initialize logger
from utils.logging import initialize_logger

initialize_logger()

# Import components
from models.commands import Command
from core.controller import Controller


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
                command_json = json.loads(line)
                command = Command.model_validate(command_json)

                # Process the command
                controller.handle_command(command)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON: {e}")
            except Exception as e:
                logger.error(f"Error handling command: {e}")
                logger.exception(e)
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        logger.exception(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
