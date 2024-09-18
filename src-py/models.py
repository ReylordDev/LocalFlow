from typing import Union
from pydantic import BaseModel


class Command(BaseModel):
    action: str


class ProgressMessage(BaseModel):
    step: str
    status: str


class FormattedTranscription(BaseModel):
    formatted_transcription: str


class Message(BaseModel):
    type: str
    data: Union[dict, ProgressMessage, FormattedTranscription]
