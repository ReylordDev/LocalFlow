import os
import time
from dotenv import load_dotenv
from httpx import request
from loguru import logger

import ollama
from groq import Groq

LANGUAGES = {
    "en": "English",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "es": "Spanish",
    "pt": "Portuguese",
    "hi": "Hindi",
    "th": "Thai",
}


class Formatter:
    def __init__(self, language: str | None = None):
        self.language = language
        pass

    def improve_transcription(self, raw_transcription: str):
        raise NotImplementedError

    def get_language(self):
        return self.language

    def set_language(self, language: str):
        self.language = language

    def generate_system_prompt(self):
        prompt = f"""# IDENTITY and PURPOSE

    You are a writing expert. You refine the input text to enhance clarity, coherence, grammar, and style. {"" if not self.language else f"You are fluent in {LANGUAGES[self.language]}."}

    # Steps

    {"" if not self.language else f"- Translate the input into {LANGUAGES[self.language]}."}
    - Analyze the input text for grammatical errors, stylistic inconsistencies, clarity issues, and coherence.
    - Apply corrections and improvements directly to the text.
    - Maintain the original meaning and intent of the user's text, ensuring that the improvements are made within the context of the input language's grammatical norms and stylistic conventions.

    # OUTPUT INSTRUCTIONS

    - Refined and improved text that has no grammar mistakes.
    {"- Return in the same language as the input." if not self.language else f"- Translate the input into {LANGUAGES[self.language]}."}
    - Include NO additional commentary or explanation in the response.

    # INPUT:

    INPUT:"""
        logger.info(prompt)
        return prompt


class LocalFormatter(Formatter):
    def __init__(self):
        if not self.is_ollama_running():
            logger.error("Ollama is not running. Starting Ollama...")
            os.system("ollama serve")
        self.MODEL = "llama3.2"
        self.status = "offline"
        logger.info(f"Using model {self.MODEL}")
        super().__init__()

    def is_ollama_running(self):
        response = request(method="GET", url="http://localhost:11434")
        if response.status_code == 200:
            logger.info("Ollama is running")
            return True
        else:
            logger.error("Ollama is not running")
            return False

    def load_model(self, keep_alive_minutes="15"):
        ollama.generate(
            model=self.MODEL,
            prompt="Wake up!",
            keep_alive=keep_alive_minutes + "m",
        )
        current_time = time.time()
        self.timeout = current_time + int(keep_alive_minutes) * 60
        self.status = "online"
        logger.info(
            f"Activated formatting model {self.MODEL} for {keep_alive_minutes} Minutes."
        )

    def unload_model(self):
        if self.status == "online":
            os.system(f"ollama stop {self.MODEL}")
            self.status = "offline"
            logger.info(f"Deactivated formatting model {self.MODEL}")

    def get_status(self):
        if self.status == "online":
            current_time = time.time()
            if current_time > self.timeout:
                self.status = "offline"
            return self.status
        else:
            return self.status

    def improve_transcription(self, raw_transcription: str):
        response = ollama.generate(
            model=self.MODEL,
            keep_alive="1m",
            system=self.generate_system_prompt(),
            prompt=f"Please improve the following transcription:\n\n{raw_transcription}",
        )
        # logger.debug(response)
        result = response["response"]
        prompt_tokens = response["prompt_eval_count"]
        response_tokens = response["eval_count"]
        total_duration = response["total_duration"] / 10**9
        logger.info(result)
        logger.info(
            f"Tokens: Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {prompt_tokens + response_tokens}"
        )
        logger.info(f"Total duration: {total_duration:.2f} seconds")
        return result


class GroqFormatter(Formatter):
    MODEL = "llama-3.1-8b-instant"

    def __init__(self):
        load_dotenv()

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        assert GROQ_API_KEY, "GROQ_API_KEY not found in .env"

        self.client = Groq(api_key=GROQ_API_KEY)
        super().__init__()

    def improve_transcription(self, raw_transcription: str):
        response = self.client.chat.completions.create(
            model=self.MODEL,
            messages=[
                {"role": "system", "content": self.generate_system_prompt()},
                {
                    "role": "user",
                    "content": f"Please improve the following transcription:\n\n{raw_transcription}",
                },
            ],
        )
        result = response.choices[0].message.content
        logger.info(result)
        if response.usage:
            prompt_tokens = response.usage.prompt_tokens
            response_tokens = response.usage.completion_tokens
            total_tokens = response.usage.total_tokens
            logger.info(
                f"Tokens: Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {total_tokens}"
            )
            total_duration = response.usage.total_time
            logger.info(f"Total duration: {total_duration:.2f} seconds")
        return result
