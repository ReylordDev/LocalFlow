import os


def is_production_environment():
    return os.environ.get("PRODUCTION") == "true"
