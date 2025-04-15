from enum import Enum


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
