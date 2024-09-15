from pydantic import BaseModel, Field, ConfigDict


class Command(BaseModel):
    action: str


class CorrectedTranscription(BaseModel):
    """
    This model represents the transcription after errors, such as misssed words, have been corrected.
    """

    updated_transcription: str = Field(
        ..., description="The transcription after changes have been made."
    )
    # changes_made: str = Field(
    #     ...,
    #     description="A short summary of the changes that were made to the transcription.",
    # )


class CleanedTranscription(BaseModel):
    """
    This model represents the transcription after filler words have been removed.
    """

    cleaned_transcription: str = Field(
        ..., description="The transcription after filler words have been removed."
    )
    filler_words_removed: str = Field(
        ...,
        description="A list of filler words that were removed from the transcription.",
    )


class StructuredTranscription(BaseModel):
    """
    This model represents the transcription after the structure has been improved.
    """

    structured_transcription: str = Field(
        ..., description="The transcription after the structure has been improved."
    )
    changes_made: str = Field(
        ...,
        description="A short summary of the changes that were made to the transcription.",
    )
