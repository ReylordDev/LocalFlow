import sys
import time
import sqlite3
from sqlite3 import Connection
from typing import Union
from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber, GroqTranscriber  # noqa: F401
from formatter import LocalFormatter, GroqFormatter  # noqa: F401
from models import (
    AudioLevel,
    Command,
    FormattedTranscription,
    HistoryItem,
    Message,
    ModelNotLoadedException,
    ProgressMessage,
)
from loguru import logger


DEV_MODE = False


def initialize_logger():
    logger.remove()
    logger.add("logs/main.log", rotation="500 MB", level="DEBUG")
    logger.info("Logger initialized.")


def print_message(
    message_type: str, data: Union[dict, FormattedTranscription, AudioLevel]
):
    print(Message(type=message_type, data=data).model_dump_json(), flush=True)


def print_progress(step: str, status: str):
    progress_message = Message(
        type="progress",
        data=ProgressMessage(step=step, status=status, timestamp=time.time()),
    )
    print(progress_message.model_dump_json())
    sys.stdout.flush()


def initialize_db():
    # Intialize the database that contains a history of the transcriptions
    conn = sqlite3.connect("transcriptions.db")
    c = conn.cursor()

    c.execute(
        """CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_transcription TEXT,
            formatted_transcription TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    conn.commit()

    return conn


def commit_transcription_to_db(
    db: Connection, transcription: str, formatted_transcription: str
):
    db.cursor().execute(
        "INSERT INTO transcriptions (raw_transcription, formatted_transcription) VALUES (?, ?)",
        (transcription, formatted_transcription),
    )

    db.commit()


def get_transcriptions_from_db(db: Connection):
    c = db.cursor()
    c.execute("SELECT * FROM transcriptions")
    transcriptions = c.fetchall()
    logger.info(f"Length of transcriptions: {len(transcriptions)}")
    return [
        HistoryItem(
            id=row[0],
            raw_transcription=row[1],
            formatted_transcription=row[2],
            created_at=row[3],
        )
        for row in transcriptions
    ]


class Controller:
    def __init__(self):
        print_progress("init", "start")
        self.recorder = AudioRecorder()
        # Create the transcriber and formatter objects (models not loaded yet)
        self.transcriber = LocalTranscriber()
        self.formatter = LocalFormatter()

        self.db_con = initialize_db()

        # Load the models for the transcriber and formatter
        self.transcriber.load_model()
        self.formatter.load_model()

        print_progress("init", "complete")
        logger.info("Controller initialized.")

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
        print_message(
            "transcription",
            {"transcription": transcription.encode("utf-8").decode("cp1252")},
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
        print_progress("commit_transcription", "start")
        commit_transcription_to_db(self.db_con, transcription, formatted_transcription)
        print_progress("commit_transcription", "complete")
        if not DEV_MODE:
            self.recorder.cleanup()

    # TODO: Move each command into their own functions
    def handle_command(self, command: Command):
        if command.action == "start":
            self.recorder.start()
            print_progress("recording", "start")
        elif command.action == "stop":
            self.recorder.stop()
            self.stop_steps()
            print_progress("all", "complete")
        elif command.action == "reset":
            if self.recorder.recording:
                self.recorder.stop()
            self.recorder = AudioRecorder()
            print_progress("reset", "complete")
        elif command.action == "status":
            return {
                print_message("status", {"status": "active"})
                if self.recorder.recording
                else print_message("status", {"status": "inactive"})
            }
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
        elif command.action == "model_status":
            print_message(
                "model_status",
                {
                    "transcriber_status": self.transcriber.get_status(),
                    "formatter_status": self.formatter.get_status(),
                },
            )
        elif command.action == "model_load":
            print_progress("model_load", "start")
            self.transcriber.load_model()
            self.formatter.load_model()
            print_progress("model_load", "complete")
        elif command.action == "model_unload":
            print_progress("model_unload", "start")
            self.transcriber.unload_model()
            self.formatter.unload_model()
            print_progress("model_unload", "complete")
        elif command.action == "transcriber_load":
            print_progress("transcriber_load", "start")
            self.transcriber.load_model()
            print_progress("transcriber_load", "complete")
        elif command.action == "transcriber_unload":
            print_progress("transcriber_unload", "start")
            self.transcriber.unload_model()
            print_progress("transcriber_unload", "complete")
        elif command.action == "formatter_load":
            print_progress("formatter_load", "start")
            self.formatter.load_model()
            print_progress("formatter_load", "complete")
        elif command.action == "formatter_unload":
            print_progress("formatter_unload", "start")
            self.formatter.unload_model()
            print_progress("formatter_unload", "complete")
        elif command.action == "get_transcriptions":
            print_progress("get_transcriptions", "start")
            transcriptions = get_transcriptions_from_db(self.db_con)
            print_message("transcriptions", {"transcriptions": transcriptions})
            print_progress("get_transcriptions", "complete")
        elif command.action == "set_language":
            if command.data and "language" in command.data:
                self.transcriber.set_language(command.data["language"])
                self.formatter.set_language(command.data["language"])
                print_message("language", {"language": command.data["language"]})
            else:
                print_message("error", {"error": "Language not provided"})
        else:
            print_message("error", {"error": "Invalid command"})


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
        except ModelNotLoadedException as e:
            print(e)
            sys.stdout.flush()


if __name__ == "__main__":
    main()
