import os
import sys
import logging
from loguru import logger
from .paths import get_user_data_path
from .environment import get_log_level, is_production_environment


class InterceptHandler(logging.Handler):
    """Intercepts standard logging messages and redirects them to loguru."""

    def emit(self, record):
        # Get corresponding loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where the logged message originated
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def initialize_logger(
    log_level: str = get_log_level(),
):
    """
    Configure logger for the application.
    Sets up logging to both stdout and a log file.
    """

    assert log_level in [
        "DEBUG",
        "INFO",
        "WARNING",
        "ERROR",
        "CRITICAL",
    ], f"Invalid log level: {log_level}"

    # Remove default logger
    logger.remove()

    # Log to stderr with colors
    if not is_production_environment():
        logger.add(
            sys.stderr,
            colorize=True,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=log_level,
        )

    # Log to file
    log_file = os.path.join(get_user_data_path(), "logs", "python.log")
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    logger.add(
        log_file,
        rotation="10 MB",  # Rotate when file reaches 10MB
        retention="1 week",  # Keep logs for 1 week
        compression="zip",  # Compress rotated logs
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=log_level,
    )

    logger.info("Logger initialized")
    logger.debug(f"Python utf-8 mode: {sys.flags.utf8_mode}")
    logger.debug(f"Stdout encoding: {sys.stdout.encoding}")

    if not sys.flags.utf8_mode:
        logger.warning(
            "Python is not running in UTF-8 mode. This may cause issues with non-ASCII characters."
        )
