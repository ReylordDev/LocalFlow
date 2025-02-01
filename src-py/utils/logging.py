import os
import sys

from loguru import logger


def initialize_logger():
    user_data_path = os.environ.get("USER_DATA_PATH", "logs")
    log_level = os.environ.get("LOG_LEVEL", "DEBUG")
    prod_mode = os.environ.get("PRODUCTION", "false")
    logger.remove()
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )
    logger.add(
        os.path.join(user_data_path, "logs", "python.log"),
        rotation="500 MB",
        level=log_level,
        encoding="utf-8",
    )
    logger.info(
        f"\nLogger initialized in {'PRODUCTION' if prod_mode == 'true' else 'DEVELOPMENT'} mode",
    )
