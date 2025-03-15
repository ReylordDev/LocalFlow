import os
import sys


def is_production_environment():
    return os.environ.get("PRODUCTION") == "true"


def is_bundled():
    return getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS")


def get_user_data_path():
    if is_bundled():
        if is_production_environment():
            return os.environ.get("USER_DATA_PATH", os.getcwd())
        else:
            return os.getcwd()
    else:
        return os.getcwd()


def get_temp_path():
    return f"{get_user_data_path()}/temp"


if __name__ == "__main__":
    print(is_bundled())
    print(is_production_environment())
    print(get_user_data_path())
