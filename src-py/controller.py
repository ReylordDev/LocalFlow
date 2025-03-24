import sys
import time
from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber
from formatter import AIProcessor
from utils.logging import initialize_logger
from utils.utils import get_temp_path
from utils.model_utils import create_instance, dump_instance
from window_detector import WindowDetector
from models import (
    AudioLevelMessage,
    Command,
    ControllerStatusType,
    DevicesMessage,
    ErrorMessage,
    LanguageModelTranscriptionMessage,
    Mode,
    Result,
    SelectDeviceCommand,
    SelectModeCommand,
    StatusMessage,
    TranscriptionMessage,
)
from utils.ipc import print_message, print_message2, print_progress
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
        print_message("status", StatusMessage(status=status))

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
        result = create_instance(
            Result,
            {
                "transcription": transcription,
                "ai_result": ai_result if self.mode.use_language_model else None,
                "mode": self.mode,
                "duration": self.recorder.get_duration(),
                "processing_time": time.time() - processing_start_time,
            },
        )
        assert isinstance(result, Result)
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
                "audio_level",
                AudioLevelMessage(audio_level=self.recorder.get_audio_level()),
            )

        elif command.action == "select_mode":
            if not isinstance(command.data, SelectModeCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            mode_id = command.data.mode_id
            mode = self.database_manager.get_mode(mode_id)
            if mode:
                self.mode = mode
                logger.info(f"Mode changed to: {mode.name}")
            else:
                print_message("error", ErrorMessage(error="Mode not found"))

        elif command.action == "get_devices":
            print_message(
                "devices", DevicesMessage(devices=self.recorder.get_devices())
            )

        elif command.action == "set_device":
            if not isinstance(command.data, SelectDeviceCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            self.recorder.set_device(command.data.index)

        elif command.action == "get_modes":
            modes: list[Mode] = list(self.database_manager.get_all_modes())
            mode_instances = []
            for mode in modes:
                mode_instance = create_instance(
                    Mode,
                    {
                        "name": mode.name,
                        "id": mode.id,
                        "default": mode.default,
                        "active": mode.active,
                        "voice_language": mode.voice_language,
                        "translate_to_english": mode.translate_to_english,
                        "use_language_model": mode.use_language_model,
                        "record_system_audio": mode.record_system_audio,
                        "text_replacements": mode.text_replacements,
                        "voice_model": mode.voice_model.model_dump(),
                        "language_model": mode.language_model.model_dump()
                        if mode.language_model
                        else None,
                        "prompt": mode.prompt.model_dump() if mode.prompt else None,
                        # "results": mode.results, # needs session implementation maybe do it later
                    },
                )
                mode_instances.append(mode_instance)

            print_message2(
                "modes", {"modes": [dump_instance(m) for m in mode_instances]}
            )


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
            print_message("error", ErrorMessage(error=f"Invalid data: {e}"))
            sys.stdout.flush()


@logger.catch
def debug():
    initialize_logger()
    logger.warning("Running Debug Mode")
    # TODO: Check that ollama is running
    controller = Controller()

    controller.handle_command(Command(action="get_modes"))

    # mode_id = controller.database_manager.get_mode_by_name("General").id
    # controller.handle_command(
    #     Command(
    #         action="select_mode",
    #         data=SelectModeCommand(mode_id=mode_id),
    #     )
    # )
    # controller.handle_command(Command(action="toggle"))
    # print("Recording started")
    # input("Press Enter to stop recording...")
    # controller.handle_command(Command(action="toggle"))


if __name__ == "__main__":
    main()
    # debug()
