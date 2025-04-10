import os
import sys
import tempfile
from .environment import is_production_environment


def get_application_path() -> str:
    """
    Get the path to the application directory.

    Returns:
        Path to the application directory
    """
    # When running in development
    if getattr(sys, "frozen", False):
        # Running in PyInstaller bundle
        app_path = os.path.dirname(sys.executable)
    else:
        # Running in development
        app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    return app_path


def get_user_data_path() -> str:
    """
    Get the path to the user data directory.

    This is where application data like database files, configurations,
    and results are stored.

    Returns:
        Path to user data directory
    """
    if is_production_environment():
        return os.environ.get("USER_DATA_PATH", os.getcwd())
    else:
        return os.getcwd()


def get_temp_path() -> str:
    """
    Get the path to the temporary directory for storing recordings.

    Returns:
        Path to temporary directory
    """
    temp_dir = os.path.join(tempfile.gettempdir(), "localflow")
    os.makedirs(temp_dir, exist_ok=True)

    return temp_dir


def get_models_path() -> str:
    """
    Get the path where AI models are stored.

    Returns:
        Path to models directory
    """
    models_path = os.path.join(get_user_data_path(), "models")
    os.makedirs(models_path, exist_ok=True)

    return models_path


def get_results_path() -> str:
    """
    Get the path where transcription results are stored.

    Returns:
        Path to results directory
    """
    results_path = os.path.join(get_user_data_path(), "results")
    os.makedirs(results_path, exist_ok=True)

    return results_path
