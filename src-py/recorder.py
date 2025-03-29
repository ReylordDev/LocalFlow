import time
import sounddevice as sd
import numpy as np
from scipy.io import wavfile
import threading
from threading import Thread
from typing import Optional
from loguru import logger
import os
from models import Device
from utils.utils import get_temp_path


class FloatStack:
    def __init__(self, max_length=10):
        self.stack: list[float] = []
        self.max_length = max_length

    def push(self, item: float):
        if len(self.stack) >= self.max_length:
            self.stack.pop(0)
        self.stack.append(item)

    def get(self):
        return self.stack

    def clear(self):
        self.stack = []

    def __len__(self):
        return len(self.stack)

    def __getitem__(self, key):
        return self.stack[key]

    def __iter__(self):
        return iter(self.stack)


class AudioRecorder:
    MAX_DURATION = 1800  # 30 minutes

    def __init__(self):
        logger.debug("Initializing AudioRecorder")
        self.recording = False
        self.audio_data = []
        self.devices = sd.query_devices()
        self.device = Device(**self.devices[sd.default.device[0]])  # type: ignore
        self.record_thread: Optional[Thread] = None
        self.stream: Optional[sd.InputStream] = None
        self.current_audio_level: float = 0
        self.audio_levels = FloatStack(max_length=20)
        self.clear_temp_files()
        self.duration = -1
        logger.debug("AudioRecorder initialized")

    def clear_temp_files(self):
        temp_path = get_temp_path()
        if os.path.exists(temp_path):
            for file in os.listdir(temp_path):
                file_path = os.path.join(temp_path, file)
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            os.rmdir(temp_path)
        os.makedirs(temp_path)

    def start(self):
        if self.recording:
            logger.warning("Recording already in progress.")
            return
        self.record_thread = threading.Thread(
            target=self.record_audio, args=(self.MAX_DURATION,)
        )
        self.start_time = time.time()
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
            self.audio_levels.push(self.current_audio_level)
            # if self.current_audio_level > 10:
            #     logger.debug(f"Audio level: {self.current_audio_level:.1f}")

        self.stream = sd.InputStream(
            callback=audio_callback,
            channels=1,
            samplerate=self.device.default_samplerate,
            device=self.device.index,
        )
        with self.stream:
            end_time = time.time() + duration_seconds
            while self.recording and time.time() < end_time:
                sd.sleep(100)

        self.recording = False
        self.duration = time.time() - self.start_time
        logger.debug(f"Recording stopped after {self.duration:.2f} seconds.")

    def interrupt_recording(self):
        if self.recording:
            self.recording = False
            if self.stream:
                self.stream.stop()
            logger.info("Recording aborted.")
            if self.record_thread:
                self.record_thread.join()
            logger.info("Recording thread terminated.")
        else:
            logger.warning("No recording in progress.")

    def stop(self):
        self.interrupt_recording()
        self.save_audio()

    def get_duration(self):
        if self.recording:
            return time.time() - self.start_time
        else:
            if self.duration == -1:
                logger.warning("No recording duration available.")
                return 0
            else:
                return self.duration

    def save_audio(self):
        if not self.audio_data:
            logger.warning("No audio data to save.")
            return

        audio_data = np.concatenate(self.audio_data, axis=0)
        file_path = f"{get_temp_path()}/recording.wav"
        wavfile.write(file_path, int(self.device.default_samplerate), audio_data)
        logger.info(f"Audio saved to {file_path}.")
        self.audio_data = []

    def get_audio_level(self):
        if self.audio_levels:
            return float(np.mean(self.audio_levels.get()))
        else:
            return 0

    def cleanup(self):
        pass

    def get_devices(self):
        devices = sd.query_devices()
        input_devices = [
            # TODO: Possible error source
            Device(**device)  # type: ignore
            for device in devices
            if device["max_input_channels"] > 0  # type: ignore
        ]
        default_device = Device(**self.devices[sd.default.device[0]])  # type: ignore
        if default_device.index in [device.index for device in input_devices]:
            index = [device.index for device in input_devices].index(
                default_device.index
            )
            input_devices[index].is_default = True
        else:
            logger.warning(
                f"Default device {default_device.name} not found in input devices."
            )
        return input_devices

    def get_device(self):
        return self.device

    def set_device(self, index):
        devices = self.get_devices()
        self.device = devices[index]
        logger.info(f"Using device: {self.device.name}")
        return self.device


if __name__ == "__main__":
    recorder = AudioRecorder()
    device = recorder.get_device()
    logger.info(f"Using device: {device.name}")
