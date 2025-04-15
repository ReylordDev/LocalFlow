import time
from loguru import logger
from models.db import Result
from api.ipc import print_nested_model
from utils.serialization import dump_instance
from models.messages import ResultMessage


class TranscriptionWorkflow:
    """
    Coordinates the end-to-end transcription workflow:
    1. Recording audio
    2. Compressing audio
    3. Transcribing audio
    4. Processing with language model
    5. Saving results
    """

    def __init__(self, controller):
        """
        Initialize the workflow with a reference to the controller

        Args:
            controller: Controller instance to update status and access components
        """
        self.controller = controller

    def execute(self):
        """
        Execute the complete transcription workflow

        Returns:
            bool: True if workflow completed successfully, False otherwise
        """
        logger.info(f"Executing transcription workflow, mode: {self.controller.mode}")
        processing_start_time = time.time()

        # Step 1: Stop recording
        recording_file = self.controller.stop_recording()
        if not recording_file:
            logger.warning("Recording file not found")
            self.controller.update_status("idle")
            return False

        # Step 2: Compress recording
        compressed_file = self.controller.compress_recording(recording_file)
        if not compressed_file:
            logger.warning("Compression failed or file not found")
            self.controller.update_status("idle")
            return False

        # Step 3: Transcribe audio
        transcription = self.controller.transcribe_audio(compressed_file)
        if not transcription:
            logger.warning("Transcription empty or failed")
            self.controller.update_status("idle")
            self.controller.compressor.cleanup()
            return False

        ai_result = None
        # Step 4: Process transcription with language model
        if self.controller.mode.use_language_model:
            ai_result = self.controller.process_transcription(transcription)

        # Step 5: Save result
        self.controller.update_status("saving")
        result = Result(
            transcription=transcription,
            ai_result=ai_result if self.controller.mode.use_language_model else None,
            mode_id=self.controller.mode.id,
            duration=self.controller.recorder.duration,
            processing_time=time.time() - processing_start_time,
        )
        self.controller.database_manager.save_result(result)
        self.controller.compressor.cleanup()

        # Step 6: Return result
        self.controller.update_status("result")
        response = ResultMessage(result=result, updateKind="result")
        dumped_response = response.model_dump()
        dumped_response["result"] = dump_instance(result.create_instance())
        print_nested_model(data=dumped_response)
        return True
