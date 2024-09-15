import os
from pyexpat import model
from dotenv import load_dotenv
from loguru import logger
from models import CorrectedTranscription, CleanedTranscription, StructuredTranscription
from openai import OpenAI

import ollama
import instructor
from groq import Groq


class Formatter:
    def __init__(self, raw_transcription: str):
        self.raw_transcription = raw_transcription
        self.fix_transcription_errors_prompt = [
            {
                "role": "system",
                "content": "Find and correct any words in the following transcription that were misheard or missed by the transcription software. Only output the corrected transcription and don't make any other changes beyond those misheard words. Use the following examples as a reference.",
            },
            {"role": "user", "content": "The knight was bold and weary."},
            {"role": "assistant", "content": "The night was cold and dreary."},
            {
                "role": "user",
                "content": "He bought a pair of new shews.",
            },
            {
                "role": "assistant",
                "content": "He bought a pair of new shoes.",
            },
            {
                "role": "user",
                "content": "The bare was chasing the dear.",
            },
            {
                "role": "assistant",
                "content": "The bear was chasing the deer.",
            },
            {
                "role": "user",
                "content": "I can't wait to meat you there.",
            },
            {
                "role": "assistant",
                "content": "I can't wait to meet you there.",
            },
            {
                "role": "user",
                "content": "She red the book in one sitting.",
            },
            {
                "role": "assistant",
                "content": "She read the book in one sitting.",
            },
        ]

        self.remove_filler_words_prompt = [
            {
                "role": "system",
                "content": "You are tasked with removing filler words from the following text. Filler words are words that do not add meaning to the sentence, such as 'um', 'uh', 'like', 'you know', etc. Do not make any other changes to the text and only output your resulting text.",
            },
            {
                "role": "user",
                "content": "Um, I think we should, like, go to the park.",
            },
            {
                "role": "assistant",
                "content": "I think we should go to the park.",
            },
            {
                "role": "user",
                "content": "Well, you know, I was just, um, wondering if you could help me.",
            },
            {
                "role": "assistant",
                "content": "I was wondering if you could help me.",
            },
            {
                "role": "user",
                "content": "So, uh, what time are we, like, meeting up?",
            },
            {
                "role": "assistant",
                "content": "What time are we meeting up?",
            },
        ]

    def format_transcription(self):
        transcription = self.fix_transcription_errors(self.raw_transcription)
        transcription = self.remove_filler_words(transcription)
        return transcription

    def fix_transcription_errors(self, text: str):
        raise NotImplementedError

    def remove_filler_words(self, text: str):
        raise NotImplementedError


class LocalFormatter(Formatter):
    MODEL = "llama3.1"

    def __init__(self, raw_transcription: str):
        self.client = instructor.from_openai(
            OpenAI(
                base_url="http://localhost:11434/v1",
                api_key="ollama",
            ),
            mode=instructor.Mode.JSON,
        )
        super().__init__(raw_transcription)

    def fix_transcription_errors(self, text: str):
        # response = self.client.completions.create(
        prompt = self.fix_transcription_errors_prompt + [
            {"role": "user", "content": text}
        ]
        response = ollama.chat(
            model=self.MODEL,
            # response_model=CorrectedTranscription,
            messages=prompt,  # type: ignore
        )
        # logger.debug(response)
        result = response["message"]["content"]
        logger.info(result)
        return result

    def remove_filler_words(self, text: str):
        # response = self.client.completions.create(
        prompt = self.remove_filler_words_prompt + [{"role": "user", "content": text}]
        response = ollama.chat(
            model=self.MODEL,
            # response_model=CleanedTranscription,
            messages=prompt,  # type: ignore
        )
        # logger.debug(response)
        result = response["message"]["content"]
        logger.info(result)
        return result


class GroqFormatter(Formatter):
    MODEL = "gemma2-9b-it"

    def __init__(self, raw_transcription: str):
        load_dotenv()

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        assert GROQ_API_KEY, "GROQ_API_KEY not found in .env"

        self.client = Groq(api_key=GROQ_API_KEY)
        super().__init__(raw_transcription)

    def fix_transcription_errors(self, text: str):
        prompt = self.fix_transcription_errors_prompt + [
            {"role": "user", "content": text}
        ]
        chat_completion = self.client.chat.completions.create(
            model=self.MODEL,
            messages=prompt,  # type: ignore
        )
        result = chat_completion.choices[0].message.content
        logger.info(result)
        return result

    def remove_filler_words(self, text: str):
        prompt = self.remove_filler_words_prompt + [{"role": "user", "content": text}]
        chat_completion = self.client.chat.completions.create(
            model=self.MODEL,
            messages=prompt,  # type: ignore
        )
        result = chat_completion.choices[0].message.content
        logger.info(result)
        return result
