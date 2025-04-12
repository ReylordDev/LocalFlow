from uuid import UUID
from loguru import logger

from api.ipc import print_message, print_nested_model, print_progress
from utils.serialization import dump_instance
from models.commands import (
    Command,
    SelectDeviceCommand,
    AddExampleCommand,
)
from models.db import (
    Mode,
    ModeCreate,
    ModeUpdate,
    TextReplacementBase,
)
from models.messages import (
    ControllerStatusType,
    StatusMessage,
    AudioLevelMessage,
    DevicesMessage,
    ErrorMessage,
    TranscriptionMessage,
    VoiceModelsMessage,
    LanguageModelsMessage,
)
from services.audio.recorder import AudioRecorder
from services.audio.compressor import Compressor
from services.ai.transcriber import LocalTranscriber
from services.ai.formatter import AIProcessor
from services.system.window_detector import WindowDetector
from services.storage.database import DatabaseManager
from core.workflow import TranscriptionWorkflow


class Controller:
    def __init__(self):
        print_progress("init", "start")

        self.recorder = AudioRecorder()
        self.compressor = Compressor()
        self.database_manager = DatabaseManager()
        self.window_detector = WindowDetector()
        self.workflow = TranscriptionWorkflow(self)

        self.status: ControllerStatusType = "idle"
        self.mode: Mode = self.database_manager.get_active_mode()
        print_progress("init", "complete")

    def update_status(self, status: ControllerStatusType):
        self.status = status
        print_message(StatusMessage(status=status), type_name="status")

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
            TranscriptionMessage(transcription=transcription),
            type_name="transcription",
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
            self.workflow.execute()
        else:
            logger.warning("Controller is not in a valid state to toggle recording.")

    def handle_cancel(self):
        if self.status == "recording":
            self.recorder.interrupt_recording()
            self.recorder = AudioRecorder()
            print_message(
                AudioLevelMessage(audio_level=0),
                type_name="audio_level",
            )
            self.update_status("idle")
        elif self.status == "result":
            print_message(
                AudioLevelMessage(audio_level=0),
                type_name="audio_level",
            )
            self.update_status("idle")
        # TODO: implement other states if needed (would need everything to be in a separate thread)
        else:
            logger.warning(
                f"Controller is not in a valid state ({self.status}) to cancel recording"
            )

    def print_refreshed_modes(self, request_id: str | None = None):
        modes = list(self.database_manager.get_all_modes())
        print_nested_model(
            {"modes": [dump_instance(m.create_instance()) for m in modes]},
            request_id=request_id,
        )

    # TODO: Move each command into their own functions
    def handle_command(self, command: Command):
        logger.info(f"Received command: {command}")
        # Extract request ID if present
        request_id = command.request_id if command.request_id else None

        if command.action == "toggle":
            self.handle_toggle()

        elif command.action == "cancel":
            self.handle_cancel()

        elif command.action == "audio_level":
            print_message(
                AudioLevelMessage(audio_level=self.recorder.get_audio_level()),
                request_id=request_id,
            )

        elif command.action == "select_mode":
            if not isinstance(command.data, UUID):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            mode_id = command.data
            mode = self.database_manager.get_mode(mode_id)
            if mode:
                self.mode = mode
                logger.info(f"Mode changed to: {mode.name}")
            else:
                print_message(
                    ErrorMessage(error="Mode not found"),
                    request_id=request_id,
                    type_name="error",
                )

        elif command.action == "get_devices":
            print_message(
                DevicesMessage(devices=self.recorder.get_devices()),
                request_id=request_id,
                type_name="devices",
            )

        elif command.action == "set_device":
            if not isinstance(command.data, SelectDeviceCommand):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            self.recorder.set_device(command.data.index)

        elif command.action == "get_modes":
            modes: list[Mode] = list(self.database_manager.get_all_modes())
            print_nested_model(
                {"modes": [dump_instance(m.create_instance()) for m in modes]},
                request_id=request_id,
                type_name="modes",
            )

        elif command.action == "create_mode":
            if not isinstance(command.data, ModeCreate):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            mode = command.data
            self.database_manager.create_mode(mode)

        elif command.action == "update_mode":
            if not isinstance(command.data, ModeUpdate):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            mode = command.data
            self.database_manager.update_mode(mode)

            self.print_refreshed_modes()

        elif command.action == "delete_mode":
            if not isinstance(command.data, UUID):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            mode_id = command.data
            self.database_manager.delete_mode(mode_id)

            self.print_refreshed_modes()

        elif command.action == "get_results":
            results = self.database_manager.get_all_results()
            print_nested_model(
                {"results": [dump_instance(r.create_instance()) for r in results]},
                request_id=request_id,
                type_name="results",
            )

        elif command.action == "delete_result":
            if not isinstance(command.data, UUID):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            result_id = command.data
            self.database_manager.delete_result(result_id)

            # not sure if this is necessary
            results = list(self.database_manager.get_all_results())
            print_nested_model(
                {"results": [dump_instance(r.create_instance()) for r in results]},
                request_id=request_id,
                type_name="results",
            )

        elif command.action == "add_example":
            if not isinstance(command.data, AddExampleCommand):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            payload = command.data
            self.database_manager.add_example(payload.prompt_id, payload.example)

        elif command.action == "get_voice_models":
            voice_models = list(self.database_manager.get_voice_models())
            print_message(
                VoiceModelsMessage(
                    voice_models=voice_models,
                ),
                request_id=request_id,
                type_name="voice_models",
            )

        elif command.action == "get_language_models":
            language_models = list(self.database_manager.get_language_models())
            print_message(
                LanguageModelsMessage(
                    language_models=language_models,
                ),
                request_id=request_id,
                type_name="language_models",
            )

        elif command.action == "get_text_replacements":
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
                request_id=request_id,
                type_name="text_replacements",
            )

        elif command.action == "create_text_replacement":
            if not isinstance(command.data, TextReplacementBase):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            _ = self.database_manager.create_global_text_replacement(command.data)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
                request_id=request_id,
                type_name="text_replacements",
            )

        elif command.action == "delete_text_replacement":
            if not isinstance(command.data, UUID):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            text_replacement_id = command.data
            self.database_manager.delete_text_replacement(text_replacement_id)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            print_nested_model(
                {"text_replacements": [tr.model_dump() for tr in text_replacements]},
                request_id=request_id,
                type_name="text_replacements",
            )

        elif command.action == "switch_mode":
            if not isinstance(command.data, UUID):
                print_message(
                    ErrorMessage(error="Invalid command data"),
                    request_id=request_id,
                    type_name="error",
                )
                return
            mode_id = command.data
            self.database_manager.switch_mode(mode_id)

            self.print_refreshed_modes()
