import time
import sounddevice as sd
import numpy as np
from scipy.io import wavfile
import threading
from threading import Thread
from typing import Optional
from loguru import logger
import os


class AudioRecorder:
    MAX_DURATION = 20

    def __init__(self):
        self.recording = False
        self.audio_data = []
        self.sample_rate = 44100  # Standard sample rate
        self.record_thread: Optional[Thread] = None
        self.stream: Optional[sd.InputStream] = None
        self.current_audio_level: float = 0
        self.id = int(time.time())
        self.output_path = f"recorder-output/{self.id}"
        os.makedirs(self.output_path, exist_ok=True)
        self.file_id = 0

    def start(self):
        if self.recording:
            logger.warning("Recording already in progress.")
            return
        self.record_thread = threading.Thread(
            target=self.record_audio, args=(self.MAX_DURATION,)
        )
        self.record_thread.start()
        logger.debug(
            f"Recording in thread {self.record_thread.name} for {self.MAX_DURATION} seconds."
        )

    def record_audio(self, duration_seconds: int):
        self.recording = True

        def audio_callback(indata, frames, time, status):
            if status:
                logger.warning(status)
            if self.recording:
                self.audio_data.append(indata.copy())
            self.current_audio_level = float(np.linalg.norm(indata) * 10)
            if self.current_audio_level > 10:
                logger.debug(f"Audio level: {self.current_audio_level:.1f}")

        self.stream = sd.InputStream(
            callback=audio_callback, channels=1, samplerate=self.sample_rate
        )
        with self.stream:
            end_time = time.time() + duration_seconds
            while self.recording and time.time() < end_time:
                sd.sleep(100)

        self.recording = False

    def stop(self):
        if self.recording:
            self.recording = False
            if self.stream:
                self.stream.stop()
            logger.info("Recording interrupted.")
            if self.record_thread:
                self.record_thread.join()
            logger.info("Recording thread terminated.")
        else:
            logger.warning("No recording in progress.")
        self.save_audio()

    def save_audio(self):
        if not self.audio_data:
            logger.warning("No audio data to save.")
            return

        audio_data = np.concatenate(self.audio_data, axis=0)
        file_path = f"{self.output_path}/{self.file_id}.wav"
        wavfile.write(file_path, self.sample_rate, audio_data)
        logger.info(f"Audio saved to {file_path}.")
        self.file_id += 1
        self.audio_data = []

    def get_audio_level(self):
        return self.current_audio_level
