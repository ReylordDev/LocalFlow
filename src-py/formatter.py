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
        prompt = """# IDENTITY and PURPOSE

    You are a writing expert. You refine the input text to enhance clarity, coherence and grammar.

    # Steps

    - Analyze the input text for grammatical errors, clarity issues, and coherence.
    - Apply corrections and improvements directly to the text.
    - Maintain the original meaning and intent of the user's text, ensuring that the improvements are made within the context of the input language's grammatical norms.

    # OUTPUT INSTRUCTIONS

    - Refined and improved text that has no grammar mistakes.
    - Include NO additional commentary or explanation in the response.

    # EXAMPLE

    INPUT:Okay, so, um... today’s meeting was pretty productive, I think. Uh, we talked about the main deliverables for the next quarter. Oh, and—right—I have to remember to send out the slides. Uh, let me make a note of that.

    Also, Sarah mentioned that the budget for the project might be tighter than we thought, so I should probably follow up with her to confirm. Hm... oh, and during the brainstorming session, uh, Mike brought up this really interesting idea about automating some of the reporting tasks. I think we should explore that more.

    What else? Oh yeah—team morale seems good overall, but I do think we need to schedule another check-in soon, just to, y'know, keep everyone aligned. Okay, uh, that’s about it for now, I guess. I’ll review this later and organize my notes better

    OUTPUT:Today's meeting was productive, I believe. We discussed the main deliverables for the next quarter, as well as other key topics. I should also send out the slides soon.
    
    Sarah mentioned that the project budget may be tighter than initially thought, so I will follow up with her to confirm this information. During the brainstorming session, Mike shared an interesting idea about automating reporting tasks – we should explore this further.
    
    Additionally, while team morale appears to be good overall, I think it would be beneficial to schedule another check-in in the near future to ensure everyone remains aligned. That's my summary of the meeting for now; I'll review and organize my notes later.

    ## INPUT:

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


if __name__ == "__main__":
    formatter = LocalFormatter()
    formatter.load_model()
    result = formatter.improve_transcription("""Alright, so, uh... I was thinking about the vacation plans for next month. I mean, we still haven’t decided on the destination, but I’m kinda leaning toward Italy. Like, I keep hearing about how amazing the food is, and—oh!—those little towns with cobblestone streets? They sound so charming.

    But then again, there’s Spain. Uh, Barcelona, in particular. I’ve always wanted to see the Sagrada Familia in person. Hmm... decisions, decisions. Oh, and I guess we should also think about the budget. Flights are, like, super expensive right now, and we’ll probably want to stay somewhere decent, y'know?

    Oh! Another thing—activities. Should we focus on, like, sightseeing, or do we want more of a relaxing vibe? Maybe a mix of both? Gosh, there’s so much to figure out. Anyway, I’ll need to look up some options later and maybe ask a few friends who’ve been to those places for their recommendations.

    Okay, uh, that’s it for now. I’ll check back after I’ve done some research.""")
    print(result)
