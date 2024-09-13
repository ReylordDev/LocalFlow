from loguru import logger
import time
from recorder import AudioRecorder


def initialize_logger():
    # logger.remove()
    logger.add("logs/main.log", rotation="500 MB", level="DEBUG")
    logger.info("Logger initialized.")


def main():
    initialize_logger()
    recorder = AudioRecorder()

    recorder.start()

    time.sleep(5)

    recorder.stop()

    recorder.save_audio("output.wav")


if __name__ == "__main__":
    main()
