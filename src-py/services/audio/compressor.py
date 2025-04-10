from ffmpeg import FFmpeg
import os
from loguru import logger
from utils.paths import get_temp_path


class Compressor:
    def __init__(self):
        logger.debug("Compressor initialized")

    def compress(self, file_path: str):
        if not os.path.exists(file_path):
            logger.error(f"File {file_path} does not exist")
            return
        logger.debug(f"Compressing {file_path}")

        output_name = file_path.replace(".wav", ".flac")

        ffmpeg = (
            FFmpeg()
            .input(file_path)
            .output(output_name, ar=16000, ac=1, map="0:a")
            .option("v", "error")
        )
        ffmpeg.execute()
        logger.info(f"Compressed {file_path} to {output_name}")
        return output_name

    def cleanup(self):
        temp_path = get_temp_path()
        if os.path.exists(f"{temp_path}/recording.wav"):
            os.remove(f"{temp_path}/recording.wav")
        if os.path.exists(f"{temp_path}/recording.flac"):
            os.remove(f"{temp_path}/recording.flac")
        logger.debug("Removed recording files")
