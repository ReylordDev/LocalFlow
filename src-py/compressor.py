from ffmpeg import FFmpeg
import os
from loguru import logger


class Compressor:
    def __init__(self, input_dir):
        self.input_dir = input_dir

    def compress(self):
        for file_name in os.listdir(self.input_dir):
            logger.debug(f"Processing {file_name}")
            if not file_name.endswith(".wav"):
                continue

            output_name = os.path.join(
                self.input_dir, file_name.replace(".wav", ".flac")
            )

            ffmpeg = (
                FFmpeg()
                .input(os.path.join(self.input_dir, file_name))
                .output(output_name, ar=16000, ac=1, map="0:a")
                .option("v", "error")
            )
            ffmpeg.execute()
            logger.info(f"Compressed {file_name} to {output_name}")
