import os
from dotenv import load_dotenv
from httpx import request
from loguru import logger

import ollama
from groq import Groq


def generate_system_prompt():
    return """You are an expert in the field of transcription. You have extensive knowledge of audio transcriptions, of filler words, and of the nuances of human speech. 

    # CAPABAILITIES

    - You can identify filler words such as "uh", "um", "so", "you know" and "like" in a transcription and remove them.
    - You can identify and correct grammatical errors in a transcription.
    - You can identify and correct punctuation errors in a transcription.
    - You can identify and correct misheard words in a transcription, based on the context of the conversation.

    # INSTRUCTIONS

    - You should aim to make the transcription as close to the original audio as possible.
    - You should aim to make the transcription grammatically correct.
    - You should aim to make the transcription free of filler words.
    - You should aim to make the transcription free of punctuation errors.
    - You should aim to make the transcription free of misheard words.
    - You should aim to make the transcription read like a coherent text.

    # OUTPUT FORMAT

    The output should be a text transcription that is free of filler words, grammatically correct, and free of punctuation errors.
    You should not include anything other than the text transcription in the output.
    Do not include any comments or annotations in the output. Don't write about the changes that you made to the transcription.

    # INPUT

    The transcription you are given is from a single speaker. 

    """


class Formatter:
    def __init__(self):
        pass

    def improve_transcription(self, raw_transcription: str):
        raise NotImplementedError


class LocalFormatter(Formatter):
    MODEL = "llama3.1"

    def __init__(self):
        if not self.is_ollama_running():
            logger.error("Ollama is not running. Starting Ollama...")
            os.system("ollama serve")
        self.wake_up()
        super().__init__()

    def is_ollama_running(self):
        response = request(method="GET", url="http://localhost:11434")
        if response.status_code == 200:
            logger.info("Ollama is running")
            return True
        else:
            logger.error("Ollama is not running")
            return False

    def wake_up(self, keep_alive_minutes="15"):
        ollama.generate(
            model=self.MODEL,
            prompt="Wake up!",
            keep_alive=keep_alive_minutes + "m",
        )
        logger.info(f"Activated model {self.MODEL} for {keep_alive_minutes} Minutes.")

    def improve_transcription(self, raw_transcription: str):
        response = ollama.generate(
            model=self.MODEL,
            keep_alive="1m",
            system=generate_system_prompt(),
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
                {"role": "system", "content": generate_system_prompt()},
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
