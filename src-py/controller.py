import sys
import time
from uuid import UUID
from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber
from formatter import AIProcessor
from utils.logging import initialize_logger
from utils.utils import get_temp_path
from window_detector import WindowDetector
from models import (
    AudioLevel,
    Command,
    ControllerStatusType,
    Devices,
    Error,
    LanguageModelTranscriptionMessage,
    Mode,
    ModelNotLoadedException,
    OllamaOfflineException,
    Result,
    SelectDeviceCommand,
    SelectModeCommand,
    TranscriptionMessage,
)
from utils.ipc import print_message, print_progress
from loguru import logger
from database import (
    DatabaseManager,
)


class Controller:
    def __init__(self):
        print_progress("init", "start")

        self.recorder = AudioRecorder()
        self.compressor = Compressor()
        self.database_manager = DatabaseManager()
        self.window_detector = WindowDetector()

        self.status: ControllerStatusType = "idle"
        self.mode: Mode = self.database_manager.get_active_mode()
        print_progress("init", "complete")

    def update_status(self, status: ControllerStatusType):
        self.status = status
        print_message("status", status)

    def execute_transcription_workflow(self):
        if self.recorder.recording:
            self.recorder.stop()
        processing_start_time = time.time()

        self.update_status("compressing")
        self.compressor.compress()

        self.update_status("loading_voice_model")
        self.transcriber = LocalTranscriber(
            self.mode.voice_model, self.mode.voice_language
        )
        self.transcriber.load_model()

        self.update_status("transcribing")
        transcription = self.transcriber.transcribe_audio(
            f"{get_temp_path()}/recording.flac"
        )
        print_message(
            "transcription",
            TranscriptionMessage(transcription=transcription),
        )
        self.transcriber.unload_model()

        if self.mode.use_language_model:
            assert self.mode.language_model is not None
            assert self.mode.prompt is not None
            self.update_status("loading_language_model")
            self.processor = AIProcessor(self.mode.language_model, self.mode.prompt)
            self.processor.load_model()

            self.update_status("generating_ai_result")
            ai_result = self.processor.process(transcription)
            print_message(
                "formatted_transcription",
                LanguageModelTranscriptionMessage(formatted_transcription=ai_result),
            )
            self.processor.unload_model()

        self.update_status("saving")
        result = Result(
            transcription=transcription,
            ai_result=ai_result if self.mode.use_language_model else None,
            duration=self.recorder.get_duration(),
            processing_time=time.time() - processing_start_time,
            mode_id=self.mode.id,
        )
        self.database_manager.save_result(result)
        self.compressor.cleanup()

        self.update_status("result")

    def handle_toggle(self):
        if self.status == "idle":
            window_info = self.window_detector.get_active_window()
            if window_info:
                # TODO: outdated code
                # self.formatter.set_active_window(ActiveWindowContext(**window_info))
                pass
            self.recorder.start()
            self.update_status("recording")
        elif self.status == "recording":
            self.execute_transcription_workflow()
        else:
            logger.warning("Controller is not in a valid state to toggle recording.")

    def handle_cancel(self):
        if self.status == "recording":
            self.recorder.interrupt_recording()
            self.recorder = AudioRecorder()
            self.update_status("idle")
        # TODO: implement other states if needed
        else:
            logger.warning("Controller is not in a valid state to cancel recording.")

    # TODO: Move each command into their own functions
    def handle_command(self, command: Command):
        logger.info(f"Received command: {command}")
        if command.action == "toggle":
            self.handle_toggle()

        elif command.action == "cancel":
            self.handle_cancel()

        elif command.action == "audio_level":
            print_message(
                "audio_level", AudioLevel(audio_level=self.recorder.get_audio_level())
            )

        elif command.action == "select_mode":
            if not isinstance(command.data, SelectModeCommand):
                print_message("error", Error(error="Invalid command data"))
                return
            mode_id = command.data.mode_id
            mode = self.database_manager.get_mode(mode_id)
            if mode:
                self.mode = mode
                logger.info(f"Mode changed to: {mode.name}")
            else:
                print_message("error", Error(error="Mode not found"))

        elif command.action == "get_history":
            raise NotImplementedError()

        elif command.action == "delete_transcription":
            raise NotImplementedError()

        elif command.action == "get_devices":
            print_message("devices", Devices(devices=self.recorder.get_devices()))

        elif command.action == "set_device":
            if not isinstance(command.data, SelectDeviceCommand):
                print_message("error", Error(error="Invalid command data"))
                return
            self.recorder.set_device(command.data.index)


@logger.catch
def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = sys.stdin.readline()
        try:
            data = Command.model_validate_json(message)
            controller.handle_command(data)
        except ValidationError as e:
            logger.error(f"Invalid data: {e}")
            print_message("error", Error(error=f"Invalid data: {e}"))
            sys.stdout.flush()


@logger.catch
def debug():
    initialize_logger()
    logger.warning("Running Debug Mode")
    controller = Controller()

    mode_id = controller.database_manager.get_mode_by_name("General").id
    controller.handle_command(
        Command(
            action="select_mode",
            data=SelectModeCommand(mode_id=mode_id),
        )
    )
    controller.handle_command(Command(action="toggle"))
    print("Recording started")
    input("Press Enter to stop recording...")
    controller.handle_command(Command(action="toggle"))


if __name__ == "__main__":
    # main()
    debug()
