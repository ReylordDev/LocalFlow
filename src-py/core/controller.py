from loguru import logger

from api.ipc import print_message, print_nested_model, print_progress
from utils.serialization import dump_instance
from models.commands import CHANNELS, Command, Action, Request, ResponselessCommand
from models.db import (
    Mode,
)
from models.messages import (
    ControllerStatusType,
    AudioLevelUpdate,
    DevicesResponse,
    LanguageModelsResponse,
    ModesResponse,
    ResultsResponse,
    StatusUpdate,
    TextReplacementsResponse,
    VoiceModelsResponse,
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
        print_message(StatusUpdate(status=status))

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
        logger.info(f"Transcription: {transcription}")
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
        logger.info(f"AI Result: {ai_result}")
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
            print_message(AudioLevelUpdate(audio_level=0))
            self.update_status("idle")
        elif self.status == "result":
            print_message(AudioLevelUpdate(audio_level=0))
            self.update_status("idle")
        # TODO: implement other states if needed (would need everything to be in a separate thread)
        else:
            logger.warning(
                f"Controller is not in a valid state ({self.status}) to cancel recording"
            )

    def print_refreshed_modes(self, request_id: str):
        modes = list(self.database_manager.get_all_modes())
        response = ModesResponse(
            data=modes,
            id=request_id,
        )
        dumped_response = response.model_dump()
        dumped_response["data"] = [dump_instance(m.create_instance()) for m in modes]
        print_nested_model(dumped_response)

    def handle_request(self, request: Request):
        logger.info(f"Received request: {request}")

        if request.channel == CHANNELS.FETCH_ALL_MODES:
            modes = list(self.database_manager.get_all_modes())
            response = ModesResponse(
                data=modes,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [
                dump_instance(m.create_instance()) for m in modes
            ]
            print_nested_model(dumped_response)

        # TODO: what about select mode?

        elif request.channel == CHANNELS.FETCH_ALL_DEVICES:
            devices = self.recorder.get_devices()
            print_message(DevicesResponse(data=devices, id=request.id))

        elif request.channel == CHANNELS.CREATE_MODE:
            self.database_manager.create_mode(request.data)
            self.print_refreshed_modes(request_id=request.id)

        elif request.channel == CHANNELS.UPDATE_MODE:
            self.database_manager.update_mode(request.data)
            self.print_refreshed_modes(request_id=request.id)

        elif request.channel == CHANNELS.DELETE_MODE:
            self.database_manager.delete_mode(request.data)
            self.print_refreshed_modes(request_id=request.id)

        elif request.channel == CHANNELS.FETCH_ALL_RESULTS:
            results = list(self.database_manager.get_all_results())
            response = ResultsResponse(
                data=results,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [
                dump_instance(r.create_instance()) for r in results
            ]
            print_nested_model(dumped_response)

        elif request.channel == CHANNELS.DELETE_RESULT:
            self.database_manager.delete_result(request.data)
            results = list(self.database_manager.get_all_results())
            response = ResultsResponse(
                data=results,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [
                dump_instance(r.create_instance()) for r in results
            ]
            print_nested_model(dumped_response)

        elif request.channel == CHANNELS.ADD_EXAMPLE:
            payload = request.data
            self.database_manager.add_example(payload.prompt_id, payload.example)
            # maybe print the refreshed models here.

        elif request.channel == CHANNELS.FETCH_ALL_VOICE_MODELS:
            voice_models = list(self.database_manager.get_voice_models())
            print_message(
                VoiceModelsResponse(
                    data=voice_models,
                    id=request.id,
                )
            )

        elif request.channel == CHANNELS.FETCH_ALL_LANGUAGE_MODELS:
            language_models = list(self.database_manager.get_language_models())
            print_message(
                LanguageModelsResponse(
                    data=language_models,
                    id=request.id,
                )
            )

        elif request.channel == CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS:
            text_replacements = list(self.database_manager.get_all_text_replacements())
            response = TextReplacementsResponse(
                data=text_replacements,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [tr.model_dump() for tr in text_replacements]
            print_message(response)

        elif request.channel == CHANNELS.CREATE_TEXT_REPLACEMENT:
            _ = self.database_manager.create_global_text_replacement(request.data)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            response = TextReplacementsResponse(
                data=text_replacements,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [tr.model_dump() for tr in text_replacements]
            print_message(response)

        elif request.channel == CHANNELS.DELETE_TEXT_REPLACEMENT:
            self.database_manager.delete_text_replacement(request.data)
            text_replacements = list(self.database_manager.get_all_text_replacements())
            response = TextReplacementsResponse(
                data=text_replacements,
                id=request.id,
            )
            dumped_response = response.model_dump()
            dumped_response["data"] = [tr.model_dump() for tr in text_replacements]
            print_message(response)

        elif request.channel == CHANNELS.ACTIVATE_MODE:
            self.database_manager.switch_mode(request.data)
            self.print_refreshed_modes(request.id)

        # TODO: This doesn't belong here
        elif request.channel == CHANNELS.SET_DEVICE:
            self.recorder.set_device(request.data.index)

    def handle_responseless_command(self, command: ResponselessCommand):
        logger.info(f"Received responseless command: {command}")

        if command.action == Action.TOGGLE:
            self.handle_toggle()
        elif command.action == Action.CANCEL:
            self.handle_cancel()
        elif command.action == Action.AUDIO_LEVEL:
            print_message(
                AudioLevelUpdate(audio_level=self.recorder.get_audio_level()),
            )
        elif command.action == Action.SWITCH_MODE:
            self.database_manager.switch_mode(command.data)

    def handle_command(self, x: Command):
        logger.info(f"Received command: {x.command}")
        if x.command.kind == "request":
            self.handle_request(x.command)
        else:
            self.handle_responseless_command(x.command)
