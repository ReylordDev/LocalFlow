from enum import Enum

from models.db import (
    LanguageModel,
    Mode,
    Result,
    TextReplacement,
    VoiceModel,
    Device,
)


class CHANNELS(str, Enum):
    """
    Enum representing IPC channels for communication between
    the Electron Processes and the Python Backend
    """

    # Mode channels
    FETCH_ALL_MODES = "database:modes:getAll"
    CREATE_MODE = "database:modes:createMode"
    UPDATE_MODE = "database:modes:updateMode"
    DELETE_MODE = "database:modes:deleteMode"
    ACTIVATE_MODE = "database:modes:activateMode"

    # Result channels
    FETCH_ALL_RESULTS = "database:results:getAll"
    DELETE_RESULT = "database:results:deleteResult"

    # Example channels
    ADD_EXAMPLE = "database:examples:addExample"

    # VoiceModel channels
    FETCH_ALL_VOICE_MODELS = "database:voiceModels:getAll"

    # LanguageModel channels
    FETCH_ALL_LANGUAGE_MODELS = "database:languageModels:getAll"

    # TextReplacement channels
    FETCH_ALL_TEXT_REPLACEMENTS = "database:textReplacements:getAll"
    CREATE_TEXT_REPLACEMENT = "database:textReplacements:create"
    DELETE_TEXT_REPLACEMENT = "database:textReplacements:delete"

    # Device channels
    FETCH_ALL_DEVICES = "device:getAll"
    SET_DEVICE = "device:set"


# Dictionary mapping every channel to its response type
# Matches response type in PythonChannelMap in channels.ts
# Wait what is this used for?
ChannelResponseType = {
    # Mode channels
    CHANNELS.FETCH_ALL_MODES: list[Mode],
    CHANNELS.CREATE_MODE: list[Mode],
    CHANNELS.UPDATE_MODE: list[Mode],
    CHANNELS.DELETE_MODE: list[Mode],
    CHANNELS.ACTIVATE_MODE: list[Mode],
    # Result channels
    CHANNELS.FETCH_ALL_RESULTS: list[Result],
    CHANNELS.DELETE_RESULT: list[Result],
    # Example channels
    CHANNELS.ADD_EXAMPLE: None,
    # VoiceModel channels
    CHANNELS.FETCH_ALL_VOICE_MODELS: list[VoiceModel],
    # LanguageModel channels
    CHANNELS.FETCH_ALL_LANGUAGE_MODELS: list[LanguageModel],
    # TextReplacement channels
    CHANNELS.FETCH_ALL_TEXT_REPLACEMENTS: list[TextReplacement],
    CHANNELS.CREATE_TEXT_REPLACEMENT: list[TextReplacement],
    CHANNELS.DELETE_TEXT_REPLACEMENT: list[TextReplacement],
    # Device channels
    CHANNELS.FETCH_ALL_DEVICES: list[Device],
    CHANNELS.SET_DEVICE: Device,
}
