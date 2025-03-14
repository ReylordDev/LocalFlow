import os
import sys
import logging
from loguru import logger
from .utils import get_user_data_path, is_production_environment


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


def initialize_logger():
    # Remove any existing loguru handlers
    logger.remove()

    # Get log level from environment variable or default to DEBUG
    log_level = os.environ.get("LOG_LEVEL", "DEBUG")

    # Add console logger (only in development)
    if not is_production_environment():
        logger.add(
            sys.stderr,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        )

    # Add file logger
    log_file = os.path.join(get_user_data_path(), "logs", "python.log")
    logger.add(
        log_file,
        rotation="500 MB",
        level=log_level,
        encoding="utf-8",
    )

    # Configure standard logging to use our interceptor
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # Configure faster-whisper logger specifically
    whisper_logger = logging.getLogger("faster_whisper")
    whisper_logger.handlers = [InterceptHandler()]
    whisper_logger.setLevel(log_level)
    whisper_logger.propagate = False

    logger.info(
        f"\nLogger initialized in {'PRODUCTION' if is_production_environment() else 'DEVELOPMENT'} mode"
    )
    logger.info(f"Python default encoding: {sys.getdefaultencoding()}")
    logger.info(f"Python utf-8 mode: {sys.flags.utf8_mode}")
    logger.info(f"Stdout encoding: {sys.stdout.encoding}")
    logger.info(f"faster-whisper logs will be captured at {log_level} level")
