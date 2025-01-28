import time
from typing import Literal, Optional, Union
from pydantic import BaseModel, RootModel


class Command(BaseModel):
    action: str
    data: Optional[dict] = None


class ProgressMessage(BaseModel):
    step: str
    status: str
    timestamp: float


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float


class FormattedTranscription(BaseModel):
    formatted_transcription: str


class AudioLevel(BaseModel):
    audio_level: float


class Message(BaseModel):
    type: str
    data: Union[
        dict, ProgressMessage, FormattedTranscription, AudioLevel, ExceptionMessage
    ]


class HistoryItem(BaseModel):
    id: int
    raw_transcription: str
    formatted_transcription: str
    created_at: str


class ModelNotLoadedException(Exception):
    def __init__(self, message="Model not loaded"):
        self.message = ExceptionMessage(exception=message, timestamp=time.time())
        super().__init__(self.message.model_dump_json())


class Bounds(BaseModel):
    x: int
    y: int
    width: int
    height: int


class BaseOwner(BaseModel):
    name: str
    processId: int
    path: str


class BaseResult(BaseModel):
    title: str
    id: int
    bounds: Bounds
    owner: BaseOwner
    memoryUsage: int


class MacOSOwner(BaseOwner):
    bundleId: str


class MacOSResult(BaseResult):
    platform: Literal["macos"]
    owner: MacOSOwner
    url: Optional[str] = None


class LinuxResult(BaseResult):
    platform: Literal["linux"]


class WindowsResult(BaseResult):
    platform: Literal["windows"]
    contentBounds: Bounds


class Result(RootModel):
    root: Union[MacOSResult, LinuxResult, WindowsResult]


class ApplicationContext(BaseModel):
    name: str
    title: str
