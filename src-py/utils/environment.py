import os


def is_production_environment():
    return os.environ.get("PRODUCTION") == "true"


def get_log_level():
    return os.environ.get("LOG_LEVEL", "DEBUG")
