import json
import sys

from pydantic import ValidationError
from recorder import AudioRecorder
from models import Command
from loguru import logger


DEV_MODE = True


def initialize_logger():
    logger.remove()
    logger.add("logs/main.log", rotation="500 MB", level="DEBUG")
    logger.info("Logger initialized.")


class Controller:
    def __init__(self):
        self.recorder = AudioRecorder()

    def handle_command(self, command: Command):
        if command.action == "start":
            self.recorder.start()
            return {"message": "Recording started"}
        elif command.action == "stop":
            self.recorder.stop()
            return {"message": "Recording stopped"}
        elif command.action == "status":
            return {
                "message": "Recording is active"
                if self.recorder.recording
                else "Recording is not active"
            }
        elif command.action == "audio_level":
            return {"audio_level": self.recorder.current_audio_level}
        elif command.action == "quit":
            if self.recorder.recording:
                self.recorder.stop()
            sys.exit(0)


def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = input()
        try:
            if not DEV_MODE:
                data = Command.model_validate_json(message)
            else:
                data = Command(action=message)

            result = controller.handle_command(data)
            print(json.dumps(result))
            sys.stdout.flush()
        except ValidationError as e:
            print(e)
            sys.stdout.flush()


if __name__ == "__main__":
    main()
