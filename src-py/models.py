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
    "delete_mode",
    "switch_mode",
    "get_results",
    "delete_result",
    "add_example",
    "get_voice_models",
    "get_language_models",
    "get_text_replacements",
    "create_text_replacement",
    "delete_text_replacement",
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


class SelectResultCommand(BaseModel):
    result_id: UUID


class SelectDeviceCommand(BaseModel):
    index: int


class SelectTextReplacementCommand(BaseModel):
    text_replacement_id: UUID


class AddExampleCommand(BaseModel):
    prompt_id: UUID
    example: "ExampleBase"


class Command(BaseModel):
    action: ActionType
    data: Optional[
        Union[
            SelectModeCommand,
            SelectDeviceCommand,
            SelectResultCommand,
            SelectTextReplacementCommand,
            AddExampleCommand,
            "ModeUpdate",
            "ModeCreate",
            "TextReplacementBase",
        ]
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


class TextReplacementsMessage(BaseModel):
    text_replacements: list["TextReplacement"]


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


class VoiceModelMessage(BaseModel):
    voice_models: list["VoiceModel"]


class LanguageModelMessage(BaseModel):
    language_models: list["LanguageModel"]


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
    "voice_models",
    "language_models",
    "text_replacements",
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
    VoiceModelMessage,
    LanguageModelMessage,
    TextReplacementsMessage,
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
    voice_language: LanguageType = Field(sa_type=String, default="auto")
    translate_to_english: bool = False
    use_language_model: bool = False
    record_system_audio: bool = False
    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class Mode(ModeBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text_replacements: list["TextReplacement"] = Relationship(
        back_populates="mode",
        sa_relationship_kwargs={"lazy": "selectin"},
        cascade_delete=True,
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
        back_populates="mode",
        sa_relationship_kwargs={"lazy": "selectin"},
        cascade_delete=True,
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
    name: str | None = None
    text_replacements: list["TextReplacementBase"] | None = None
    voice_model_name: VoiceModelNameType | None = None
    language_model_name: str | None = None
    prompt: Optional["PromptUpdate"] | None = None


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
        back_populates="prompt",
        sa_relationship_kwargs={"lazy": "selectin"},
        cascade_delete=True,
    )


class PromptCreate(PromptBase):
    examples: list["ExampleBase"] = []


class PromptUpdate(PromptBase):
    system_prompt: str | None = None
    include_clipboard: bool | None = None
    include_active_window: bool | None = None
    examples: list["ExampleBase"] | None = None


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

    def apply_replacement(self, text: str) -> str:
        if not self.original_text or not self.replacement_text:
            return text
        return text.replace(self.original_text, self.replacement_text)


class ResultBase(SQLModel):
    created_at: float = Field(default_factory=time.time)
    transcription: str
    ai_result: str | None
    duration: float
    processing_time: float

    model_config = ConfigDict(
        from_attributes=True,
    )  # type: ignore


class Result(ResultBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    mode_id: UUID = Field(foreign_key="mode.id")
    mode: Mode = Relationship(
        back_populates="results", sa_relationship_kwargs={"lazy": "selectin"}
    )

    @computed_field
    @property
    def location(self) -> str:
        location = os.path.join(get_user_data_path(), "results", str(self.id))
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
                "location": self.location,
            },
        )
        return result_instance  # type: ignore[return-value]
