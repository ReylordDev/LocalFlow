import platform
from pywinctl import getActiveWindow, Window
from loguru import logger


class WindowDetector:
    def get_active_window(self) -> dict:
        """Returns active window info with platform-specific details"""
        try:
            window: Window | None = getActiveWindow()
            if not window:
                return {}

            logger.info(window)

            return {
                "title": window.title,
                "process": self._get_process_info(window),
                "platform": platform.system().lower(),
                "app_name": window.getAppName(),  # Application name
            }
        except Exception as e:
            logger.error(f"Window detection error: {str(e)}")
            return {}

    def _get_process_info(self, window: Window) -> str:
        """Extract process name in platform-appropriate way"""
        system = platform.system()
        if system == "Windows":
            return str(window.getPID())  # Process ID
        elif system == "Darwin":
            return window.getAppName()  # Bundle ID on macOS
        elif system == "Linux":
            return str(window.getPID())  # Process ID
        return "unknown"
