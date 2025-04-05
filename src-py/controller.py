import sys
import time
from pydantic import ValidationError
from recorder import AudioRecorder
from compressor import Compressor
from transcriber import LocalTranscriber
from formatter import AIProcessor
from utils.logging import initialize_logger
from utils.model_utils import dump_instance
from utils.utils import get_lorem_ipsum
from window_detector import WindowDetector
from models import (
    AddExampleCommand,
    AudioLevelMessage,
    Command,
    ControllerStatusType,
    DevicesMessage,
    ErrorMessage,
    LanguageModelMessage,
    Mode,
    ModeCreate,
    ModeUpdate,
    Result,
    SelectDeviceCommand,
    SelectModeCommand,
    SelectResultCommand,
    SelectTextReplacementCommand,
    StatusMessage,
    TranscriptionMessage,
    VoiceModelMessage,
    TextReplacementBase,
)
from utils.ipc import print_message, print_nested_model, print_progress
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

    def stop_recording(self):
        if self.recorder.recording:
            self.recorder.stop()
        return self.recorder.get_file_path()

    def compress_recording(self, file_path: str):
        self.update_status("compressing")
        compressed_file = self.compressor.compress(file_path)
        return compressed_file

    def transcribe_audio(self, file_path: str):
        self.update_status("loading_voice_model")
        global_text_replacements = list(
            self.database_manager.get_global_text_replacements()
        )
        self.transcriber = LocalTranscriber(self.mode, global_text_replacements)
        self.transcriber.load_model()

        self.update_status("transcribing")
        transcription = self.transcriber.transcribe_audio(file_path)
        print_message(
            "transcription",
            TranscriptionMessage(transcription=transcription),
        )
        self.transcriber.unload_model()
        return transcription

    def process_transcription(self, transcription: str):
        assert self.mode.language_model is not None
        assert self.mode.prompt is not None
        self.update_status("loading_language_model")
        self.processor = AIProcessor(self.mode)
        self.processor.load_model()

        self.update_status("generating_ai_result")
        ai_result = self.processor.process(transcription)
        self.processor.unload_model()

        return ai_result

    def execute_transcription_workflow(self):
        logger.info(f"Executing transcription workflow, mode: {self.mode}")
        processing_start_time = time.time()
        recording_file = self.stop_recording()
        if not recording_file:
            logger.warning("Recording file not found")
            self.update_status("idle")
            return

        compressed_file = self.compress_recording(recording_file)
        if not compressed_file:
            logger.warning("Compression failed or file not found")
            self.update_status("idle")
            return

        transcription = self.transcribe_audio(compressed_file)

        if not transcription:
            logger.warning("Transcription empty or failed")
            self.update_status("idle")
            self.compressor.cleanup()
            return

        ai_result = None

        if self.mode.use_language_model:
            ai_result = self.process_transcription(transcription)

        self.update_status("saving")
        result = Result(
            transcription=transcription,
            ai_result=ai_result if self.mode.use_language_model else None,
            mode_id=self.mode.id,
            duration=self.recorder.duration,
            processing_time=time.time() - processing_start_time,
        )
        self.database_manager.save_result(result)
        self.compressor.cleanup()

        self.update_status("result")
        print_nested_model(
            "result", {"result": dump_instance(result.create_instance())}
        )

    def handle_toggle(self):
        self.mode = self.database_manager.get_active_mode()
        if self.status == "idle" or self.status == "result":
            if (
                self.mode.use_language_model
                and self.mode.prompt
                and self.mode.prompt.include_active_window
            ):
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
            print_message(
                "audio_level",
                AudioLevelMessage(audio_level=0),
            )
            self.update_status("idle")
        elif self.status == "result":
            print_message(
                "audio_level",
                AudioLevelMessage(audio_level=0),
            )
            self.update_status("idle")
        # TODO: implement other states if needed (would need everything to be in a separate thread)
        else:
            logger.warning(
                f"Controller is not in a valid state ({self.status}) to cancel recording"
            )

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

            print_nested_model(
                "modes", {"modes": [dump_instance(m.create_instance()) for m in modes]}
            )

        elif command.action == "create_mode":
            if not isinstance(command.data, ModeCreate):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            mode = command.data
            self.database_manager.create_mode(mode)

        elif command.action == "update_mode":
            if not isinstance(command.data, ModeUpdate):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            mode = command.data
            self.database_manager.update_mode(mode)

            modes = list(self.database_manager.get_all_modes())

            print_nested_model(
                "modes", {"modes": [dump_instance(m.create_instance()) for m in modes]}
            )

        elif command.action == "delete_mode":
            if not isinstance(command.data, SelectModeCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            mode_id = command.data.mode_id
            self.database_manager.delete_mode(mode_id)

            # not sure if this is necessary
            modes = list(self.database_manager.get_all_modes())

            print_nested_model(
                "modes", {"modes": [dump_instance(m.create_instance()) for m in modes]}
            )

        elif command.action == "get_results":
            results = self.database_manager.get_all_results()
            print_nested_model(
                "results",
                {"results": [dump_instance(r.create_instance()) for r in results]},
            )

        elif command.action == "delete_result":
            if not isinstance(command.data, SelectResultCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            result_id = command.data.result_id
            self.database_manager.delete_result(result_id)

            # not sure if this is necessary
            results = list(self.database_manager.get_all_results())
            print_nested_model(
                "results",
                {"results": [dump_instance(r.create_instance()) for r in results]},
            )

        elif command.action == "add_example":
            if not isinstance(command.data, AddExampleCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            payload = command.data
            self.database_manager.add_example(payload.prompt_id, payload.example)

        elif command.action == "get_voice_models":
            voice_models = list(self.database_manager.get_voice_models())
            print_message(
                "voice_models",
                VoiceModelMessage(
                    voice_models=voice_models,
                ),
            )

        elif command.action == "get_language_models":
            language_models = list(self.database_manager.get_language_models())
            print_message(
                "language_models",
                LanguageModelMessage(
                    language_models=language_models,
                ),
            )

        elif command.action == "get_text_replacements":
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                "text_replacements",
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
            )

        elif command.action == "create_text_replacement":
            if not isinstance(command.data, TextReplacementBase):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            _ = self.database_manager.create_global_text_replacement(command.data)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                "text_replacements",
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
            )

        elif command.action == "delete_text_replacement":
            if not isinstance(command.data, SelectTextReplacementCommand):
                print_message("error", ErrorMessage(error="Invalid command data"))
                return
            text_replacement_id = command.data.text_replacement_id
            self.database_manager.delete_text_replacement(text_replacement_id)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                "text_replacements",
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
            )


@logger.catch
def main():
    initialize_logger()
    # TODO: Check that ollama is running
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
    controller = Controller()

    controller.process_transcription("Hello, how are you?")

    # mode_id = controller.database_manager.get_mode_by_name("General_4").id

    # controller.database_manager.update_mode(
    #     ModeUpdate(
    #         id=mode_id,
    #         name="General_4",
    #         prompt=PromptUpdate(
    #             system_prompt="Hello, how can I help you today?",
    #             include_clipboard=True,
    #             examples=[
    #                 ExampleBase(
    #                     input="Hello, how are you?",
    #                     output="I'm doing well, thank you!",
    #                 )
    #             ],
    #         ),
    #     )
    # )


if __name__ == "__main__":
    main()
    # debug()
