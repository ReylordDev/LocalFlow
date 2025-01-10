from typing import Union
from pydantic import BaseModel


class Command(BaseModel):
    action: str


class ProgressMessage(BaseModel):
    step: str
    status: str
    timestamp: float


class FormattedTranscription(BaseModel):
    formatted_transcription: str


class AudioLevel(BaseModel):
    audio_level: float


class Message(BaseModel):
    type: str
    data: Union[dict, ProgressMessage, FormattedTranscription, AudioLevel]


class HistoryItem(BaseModel):
    id: int
    raw_transcription: str
    formatted_transcription: str
    created_at: str
