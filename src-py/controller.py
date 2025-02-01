import os
import sys
from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber
from formatter import LocalFormatter
from utils.logging import initialize_logger
from window_detector import WindowDetector
from models import (
    ActiveWindowContext,
    AudioLevel,
    Command,
    Devices,
    Error,
    FormattedTranscription,
    History,
    ModelNotLoadedException,
    ActionType,
    ModelStatus,
    RawTranscription,
)
from utils.ipc import print_message, print_progress
from loguru import logger
from database import (
    initialize_db,
    commit_transcription_to_db,
    get_all_transcriptions_from_db,
    delete_transcription_from_db,
)


class Controller:
    def __init__(self):
        print_progress("init", "start")

        self.recorder = AudioRecorder()
        self.transcriber = LocalTranscriber()
        self.formatter = LocalFormatter()
        self.window_detector = WindowDetector()
        self.db_con = initialize_db()

        # Load the models for the transcriber and formatter
        self.transcriber.load_model()
        self.formatter.load_model()

        print_progress("init", "complete")

    def handle_stop(self):
        if self.recorder.recording:
            self.recorder.stop()
        print_progress("recording", "complete")
        print_progress("compression", "start")
        self.compressor = Compressor(f"recorder-output/{self.recorder.id}")
        self.compressor.compress()
        print_progress("compression", "complete")
        print_progress("transcription", "start")
        transcription = self.transcriber.transcribe_files(
            f"recorder-output/{self.recorder.id}"
        )
        print_progress("transcription", "complete")
        print_message(
            "raw_transcription",
            RawTranscription(
                transcription=transcription.encode("utf-8").decode("cp1252")
            ),
        )
        self.formatter.set_language(self.transcriber.language)
        formatted_transcription = self.formatter.improve_transcription(transcription)
        print_progress("formatting", "complete")
        print_message(
            "formatted_transcription",
            FormattedTranscription(
                formatted_transcription=formatted_transcription.encode("utf-8").decode(
                    "cp1252"
                )
            ),
        )
        print_progress("committing_to_history", "start")
        commit_transcription_to_db(self.db_con, transcription, formatted_transcription)
        print_progress("committing_to_history", "complete")
        if bool(os.environ.get("DEVELOPMENT", False)):
            self.recorder.cleanup()

    # TODO: Move each command into their own functions
    def handle_command(self, command: Command):
        if command.action == "start":
            window_info = self.window_detector.get_active_window()
            if window_info:
                self.formatter.set_active_window(ActiveWindowContext(**window_info))
            self.recorder.start()
            print_progress("recording", "start")

        elif command.action == "stop":
            self.handle_stop()

        elif command.action == "reset":
            print_progress("reset", "start")
            if self.recorder.recording:
                self.recorder.stop()
            self.recorder = AudioRecorder()
            print_progress("reset", "complete")

        elif command.action == "audio_level":
            print_message(
                "audio_level", AudioLevel(audio_level=self.recorder.current_audio_level)
            )

        elif command.action == "quit":
            if self.recorder.recording:
                self.recorder.stop()
            self.transcriber.unload_model()
            self.formatter.unload_model()
            sys.exit(0)

        elif command.action == "model_status":
            print_message(
                "model_status",
                ModelStatus(
                    transcriber_status=self.transcriber.get_status(),
                    formatter_status=self.formatter.get_status(),
                ),
            )

        elif command.action == "model_load":
            print_progress("model_load", "start")
            self.transcriber.load_model()
            self.formatter.load_model()
            print_progress("model_load", "complete")

        elif command.action == "get_history":
            print_progress("get_history", "start")
            transcriptions = get_all_transcriptions_from_db(self.db_con)
            print_message("history", History(transcriptions=transcriptions))
            print_progress("get_history", "complete")

        elif command.action == "delete_transcription":
            if command.data and "id" in command.data:
                print_progress("delete_transcription", "start")
                transcription_id = command.data["id"]
                delete_transcription_from_db(self.db_con, transcription_id)
                # Send updated list
                transcriptions = get_all_transcriptions_from_db(self.db_con)
                print_message("history", History(transcriptions=transcriptions))
                print_progress("delete_transcription", "complete")
            else:
                print_message("error", Error(error="Transcription ID not provided"))

        elif command.action == "set_language":
            if command.data and "language" in command.data:
                self.transcriber.set_language(command.data["language"])
                self.formatter.set_language(command.data["language"])
            else:
                print_message("error", Error(error="Language not provided"))

        elif command.action == "get_devices":
            print_message("devices", Devices(devices=self.recorder.get_devices()))

        elif command.action == "set_device":
            if command.data and "index" in command.data:
                self.recorder.set_device(command.data["index"])
            else:
                print_message("error", Error(error="Device index not provided"))


@logger.catch
def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = input()
        try:
            if bool(os.environ.get("DEVELOPMENT", False)):
                data = Command.model_validate_json(message)
            else:
                if message in ActionType.__args__:
                    action: ActionType = message  # type: ignore
                    data = Command(action=action)
                else:
                    logger.error(f"Invalid command: {message}")
                    print_message("error", Error(error=f"Invalid command: {message}"))

            controller.handle_command(data)
        except ValidationError as e:
            print(e)
            sys.stdout.flush()
        except ModelNotLoadedException as e:
            print(e)
            sys.stdout.flush()


if __name__ == "__main__":
    main()
