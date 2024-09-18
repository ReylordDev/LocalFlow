import sys
from typing import Union

from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber, GroqTranscriber  # noqa: F401
from formatter import LocalFormatter, GroqFormatter  # noqa: F401
from models import Command, FormattedTranscription, Message, ProgressMessage
from loguru import logger


DEV_MODE = False


def initialize_logger():
    logger.remove()
    logger.add("logs/main.log", rotation="500 MB", level="DEBUG")
    logger.info("Logger initialized.")


def print_message(message_type: str, data: Union[dict, FormattedTranscription]):
    print(Message(type=message_type, data=data).model_dump_json(), flush=True)


def print_progress(step: str, status: str):
    progress_message = Message(
        type="progress", data=ProgressMessage(step=step, status=status)
    )
    print(progress_message.model_dump_json())
    sys.stdout.flush()


class Controller:
    def __init__(self):
        self.recorder = AudioRecorder()
        self.transcriber = LocalTranscriber()
        self.formatter = LocalFormatter()
        print_progress("init", "complete")

    def stop_steps(self):
        if self.recorder.recording:
            self.recorder.stop()
        print_progress("recording", "complete")
        self.compressor = Compressor(f"recorder-output/{self.recorder.id}")
        self.compressor.compress()
        print_progress("compression", "complete")
        transcription = self.transcriber.transcribe_files(
            f"recorder-output/{self.recorder.id}"
        )
        print_progress("transcription", "complete")
        print_message("transcription", {"transcription": transcription})
        formatted_transcription = self.formatter.improve_transcription(transcription)
        print_progress("formatting", "complete")
        print_message(
            "formatted_transcription",
            FormattedTranscription(formatted_transcription=formatted_transcription),
        )

    def handle_command(self, command: Command):
        if command.action == "start":
            self.recorder.start()
            print_progress("recording", "start")
        elif command.action == "stop":
            self.recorder.stop()
            self.stop_steps()
            print_progress("all", "complete")
        elif command.action == "status":
            return {
                print_message("status", {"status": "active"})
                if self.recorder.recording
                else print_message("status", {"status": "inactive"})
            }
        elif command.action == "audio_level":
            print_message(
                "audio_level", {"audio_level": self.recorder.current_audio_level}
            )
        elif command.action == "quit":
            if self.recorder.recording:
                self.recorder.stop()
            sys.exit(0)
        elif command.action == "compress":
            self.compressor = Compressor(f"recorder-output/{self.recorder.id}")
            self.compressor.compress()
            print_progress("compression", "complete")
        elif command.action == "transcribe":
            transcription = self.transcriber.transcribe_files(
                f"recorder-output/{self.recorder.id}"
            )
            print_progress("transcription", "complete")
            print_message("transcription", {"transcription": transcription})
        elif command.action == "format":
            transcription = self.transcriber.transcribe_files(
                f"recorder-output/{self.recorder.id}"
            )
            formatted_transcription = self.formatter.improve_transcription(
                raw_transcription=transcription
            )
            print_progress("formatting", "complete")
            print_message(
                "formatted_transcription",
                FormattedTranscription(formatted_transcription=formatted_transcription),
            )


@logger.catch
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

            controller.handle_command(data)
        except ValidationError as e:
            print(e)
            sys.stdout.flush()


if __name__ == "__main__":
    main()
