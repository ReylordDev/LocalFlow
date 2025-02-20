from ffmpeg import FFmpeg
import os
from loguru import logger
from utils.utils import get_user_data_path


class Compressor:
    PATH = f"{get_user_data_path()}/temp"

    def __init__(self):
        pass

    def compress(self):
        file_name = f"{self.PATH}/recording.wav"
        logger.debug(f"Processing {file_name}")

        output_name = file_name.replace(".wav", ".flac")

        ffmpeg = (
            FFmpeg()
            .input(file_name)
            .output(output_name, ar=16000, ac=1, map="0:a")
            .option("v", "error")
        )
        ffmpeg.execute()
        logger.info(f"Compressed {file_name} to {output_name}")

    def cleanup(self):
        os.remove(f"{self.PATH}/recording.wav")
        os.remove(f"{self.PATH}/recording.flac")
        logger.debug("Removed recording files")
