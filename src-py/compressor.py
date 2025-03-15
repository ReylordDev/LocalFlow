from ffmpeg import FFmpeg
import os
from loguru import logger
from utils.utils import get_temp_path


class Compressor:
    def __init__(self):
        logger.debug("Compressor initialized")

    def compress(self):
        file_name = f"{get_temp_path()}/recording.wav"
        logger.debug(f"Compressing {file_name}")

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
        temp_path = get_temp_path()
        if os.path.exists(f"{temp_path}/recording.wav"):
            os.remove(f"{temp_path}/recording.wav")
        if os.path.exists(f"{temp_path}/recording.flac"):
            os.remove(f"{temp_path}/recording.flac")
        logger.debug("Removed recording files")
