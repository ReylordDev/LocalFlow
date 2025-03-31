import os
import time
from typing import Literal, Union, Optional
from uuid import uuid4, UUID
from pydantic import BaseModel, ConfigDict, computed_field
from utils.utils import get_user_data_path
from utils.model_utils import create_instance, dump_instance


from sqlmodel import (
    Field,
    Relationship,
    SQLModel,
    String,
)


StatusType = Literal["start", "complete", "error"]
ActionType = Literal[
    "toggle",
    "cancel",
    "reset",
    "audio_level",
    "select_mode",
    "get_devices",
    "set_device",
    "get_modes",
    "create_mode",
    "update_mode",
    "get_results",
]
StepType = Union[
    ActionType,
    Literal[
        "init",
        "recording",
        "compression",
        "transcription",
    ],
]


### Electron -> Python IPC


class SelectModeCommand(BaseModel):
    mode_id: UUID


class SelectDeviceCommand(BaseModel):
    index: int


class Command(BaseModel):
    action: ActionType
    data: Optional[
        Union[SelectModeCommand, SelectDeviceCommand, "ModeUpdate", "ModeCreate"]
    ] = None


#########################


### Python -> Electron IPC


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float


class ExceptionMessage(BaseModel):
    exception: str
    timestamp: float


class TranscriptionMessage(BaseModel):
    transcription: str


class AudioLevelMessage(BaseModel):
    audio_level: float


class ErrorMessage(BaseModel):
    error: str


class Device(BaseModel):
    name: str
    index: int
    default_samplerate: float
    is_default: bool = False


class DevicesMessage(BaseModel):
    devices: list[Device]


class ModesMessage(SQLModel):
    modes: list["Mode"]


ControllerStatusType = Literal[
    "idle",
    "recording",
    "compressing",
    "loading_voice_model",
    "transcribing",
    "loading_language_model",
    "generating_ai_result",
    "saving",
    "result",
]


class StatusMessage(BaseModel):
    status: ControllerStatusType


class ResultMessage(BaseModel):
    result: "Result"


class ResultsMessage(BaseModel):
    results: list["Result"]


MessageType = Literal[
    "progress",
    "transcription",
    "audio_level",
    "exception",
    "devices",
    "error",
    "status",
    "modes",
    "modes_update",
    "result",
    "results",
]

MessageDataType = Union[
    ProgressMessage,
    TranscriptionMessage,
    AudioLevelMessage,
    ExceptionMessage,
    DevicesMessage,
    ErrorMessage,
    StatusMessage,
    ModesMessage,
    ResultMessage,
    ResultsMessage,
    dict,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType


#################


class ModelNotLoadedException(Exception):
    def __init__(self, message="Model not loaded"):
        self.message = ExceptionMessage(exception=message, timestamp=time.time())
        super().__init__(self.message.model_dump_json())


class OllamaOfflineException(Exception):
    def __init__(self, message="Ollama is not running"):
        self.message = ExceptionMessage(exception=message, timestamp=time.time())
        super().__init__(self.message.model_dump_json())


class ApplicationContext(BaseModel):
    name: str
    title: str


class ActiveWindowContext(BaseModel):
    title: str
    process: str
    platform: Literal["windows", "darwin", "linux"]
    app_name: str


### SQLModels

# TODO: Check that this is correct
LanguageType = Literal["auto", "en", "de", "fr", "it", "es", "pt", "hi", "th"]

language_name_map: dict[LanguageType, str] = {
    "auto": "Auto",
    "en": "English",
    "de": "German",
    "fr": "French",
    "it": "Italian",
    "es": "Spanish",
    "pt": "Portuguese",
    "hi": "Hindi",
    "th": "Thai",
}

VoiceModelNameType = Literal["large-v3-turbo", "large-v3", "distil-large-v3"]


class ModeBase(SQLModel):
    name: str = Field(index=True)
    default: bool = False
    active: bool = False
    voice_language: LanguageType = Field(sa_type=String)
    translate_to_english: bool = False
    use_language_model: bool = False
    record_system_audio: bool = False
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class Mode(ModeBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text_replacements: list["TextReplacement"] = Relationship(
        back_populates="mode", sa_relationship_kwargs={"lazy": "selectin"}
    )

    voice_model: "VoiceModel" = Relationship(
        back_populates="modes", sa_relationship_kwargs={"lazy": "selectin"}
    )
    voice_model_id: UUID = Field(foreign_key="voicemodel.id")

    language_model: Optional["LanguageModel"] = Relationship(
        back_populates="modes", sa_relationship_kwargs={"lazy": "selectin"}
    )
    language_model_id: str | None = Field(
        foreign_key="languagemodel.name", default=None
    )

    prompt: Optional["Prompt"] = Relationship(
        back_populates="mode", sa_relationship_kwargs={"lazy": "selectin"}
    )

    results: list["Result"] = Relationship(back_populates="mode")

    def create_instance(self) -> "Mode":
        if self.prompt:
            prompt_dumped = self.prompt.model_dump()
            if prompt_dumped and self.prompt.examples:
                prompt_dumped["examples"] = [
                    example.model_dump() for example in self.prompt.examples
                ]
        else:
            prompt_dumped = None
        mode_instance = create_instance(
            Mode,
            {
                "name": self.name,
                "id": self.id,
                "default": self.default,
                "active": self.active,
                "voice_language": self.voice_language,
                "translate_to_english": self.translate_to_english,
                "use_language_model": self.use_language_model,
                "record_system_audio": self.record_system_audio,
                "text_replacements": [tr.model_dump() for tr in self.text_replacements],
                "voice_model": self.voice_model.model_dump(),
                "language_model": self.language_model.model_dump()
                if self.language_model
                else None,
                "prompt": prompt_dumped,
                # "results": mode.results, # needs session implementation maybe do it later
            },
        )
        return mode_instance  # type: ignore[return-value]


class ModeCreate(ModeBase):
    voice_model_name: VoiceModelNameType
    language_model_name: str | None = None
    prompt: Optional["PromptCreate"] = None
    text_replacements: list["TextReplacementBase"] = []


class ModeUpdate(ModeCreate):
    id: UUID


class VoiceModelBase(SQLModel):
    name: VoiceModelNameType = Field(sa_type=String, index=True)
    language: Literal["english-only", "multilingual"] = Field(sa_type=String)
    speed: int
    accuracy: int
    size: int
    parameters: int
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class VoiceModel(VoiceModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    modes: list[Mode] = Relationship(back_populates="voice_model")


class LanguageModel(SQLModel, table=True):
    name: str = Field(primary_key=True)  # Replace type with compatible models
    modes: list[Mode] = Relationship(back_populates="language_model")
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class PromptBase(SQLModel):
    system_prompt: str
    include_clipboard: bool = False
    include_active_window: bool = False  # TODO: research
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class Prompt(PromptBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    mode_id: UUID = Field(foreign_key="mode.id")
    mode: Mode = Relationship(back_populates="prompt")

    examples: list["Example"] = Relationship(
        back_populates="prompt", sa_relationship_kwargs={"lazy": "selectin"}
    )


class PromptCreate(PromptBase):
    examples: list["ExampleBase"] = []


class ExampleBase(SQLModel):
    input: str
    output: str
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class Example(ExampleBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    prompt_id: UUID = Field(foreign_key="prompt.id")
    prompt: Prompt = Relationship(back_populates="examples")


class TextReplacementBase(SQLModel):
    original_text: str
    replacement_text: str

    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class TextReplacement(TextReplacementBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    mode_id: UUID | None = Field(foreign_key="mode.id")
    mode: Mode | None = Relationship(back_populates="text_replacements")


class ResultBase(SQLModel):
    created_at: float = Field(default_factory=time.time)
    transcription: str
    ai_result: str | None
    duration: float
    processing_time: float


class Result(ResultBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    mode_id: UUID = Field(foreign_key="mode.id")
    mode: Mode = Relationship(
        back_populates="results", sa_relationship_kwargs={"lazy": "selectin"}
    )

    @computed_field
    @property
    def location(self) -> str:
        location = f"{get_user_data_path()}/results/{self.id}"
        os.makedirs(location, exist_ok=True)
        return location

    def create_instance(self) -> "Result":
        result_instance = create_instance(
            Result,
            {
                "id": self.id,
                "created_at": self.created_at,
                "transcription": self.transcription,
                "ai_result": self.ai_result,
                "duration": self.duration,
                "processing_time": self.processing_time,
                "mode": dump_instance(self.mode.create_instance()),
            },
        )
        return result_instance  # type: ignore[return-value]
