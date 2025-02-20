import os
import time
from typing import Literal, Optional
from httpx import request
from loguru import logger
from models import (
    ActiveWindowContext,
    ApplicationContext,
    OllamaOfflineException,
)


import ollama

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
        self.active_window: Optional[ActiveWindowContext] = None

    def improve_transcription(self, raw_transcription: str):
        raise NotImplementedError

    def get_language(self):
        return self.language

    def set_language(self, language: str | None):
        self.language = language

    def get_active_window(self):
        return self.active_window

    def set_active_window(self, window: ActiveWindowContext):
        self.active_window = window

    def get_application_context(self):
        active_window = self.get_active_window()
        logger.info(active_window)
        if not active_window:
            logger.info("No active window found")
            return None

        return ApplicationContext(
            name=active_window.app_name.strip(".exe"),
            title=active_window.title,
        )

    def generate_system_prompt(self):
        app_context = self.get_application_context()

        identity_purpose = f"""# IDENTITY and PURPOSE

        You are a transcription expert. Your task is to refine the input transcription by removing or fixing all speech disfluencies. That includes filler words, false starts, repetitions, pauses and colloquial interjections. {f"The text will be used in the application {app_context.name}. The current window title is {app_context.title}." if app_context else ""}
        """

        steps = """# Steps

        - Analyze the input text for speech disfluencies.
        - Apply corrections directly to the text.
        - Maintain the original meaning and intent of the user's text, ensuring that the improvements are made within the context of the input language's grammatical norms.
        """

        formatting_rules = {
            "Notion": "- Format the text for Notion using github markdown (headings, lists, bullet points, checkboxes). Split the text into paragraphs using double line breaks.",
        }
        context_rules = ""
        if app_context:
            context_rules = formatting_rules.get(app_context.name, "")
            if app_context.name not in formatting_rules:
                logger.info(
                    f"No formatting rules found for application {app_context.name}"
                )

        output_instructions = f"""# OUTPUT INSTRUCTIONS

        - Refined text that has no speech disfluencies.
        - Include NO additional commentary or explanation in the response.
        - Ensure that the output is in {LANGUAGES[self.language] if self.language else "English"}.
        {context_rules}
        """

        example_1 = """INPUT:
I watched the Ted Lasso scene yesterday, the darts scene, in the original English synchronization. And I like the English synchronization much more. However, one important thing with that scene is the lesson or the quote that Ted Lasso mentions, which is, be curious, not judgmental. And I think that's actually very wise. And I would like to incorporate it more in my own life. You know, be curious, not judgmental.

OUTPUT:
I watched the Ted Lasso darts scene yesterday in the original English synchronization and I like it much more. However, one important thing in that scene is the quote that Ted Lasso mentions, which is, "Be curious, not judgmental." I think that's actually very wise and I would like to incorporate it more into my own life.
"""

        example_2 = """INPUT:
 Today, I think the major progress I can make is number one. I can print out the form for my graduation. I can sign it. And second, I can continue working on the local flow project. Actually, no, scratch that. I won't work on that today. However, what I can do is I can try it out as much as possible, actually get some usage statistics in. And third, I can actually get started on the response embedding clustering project.

OUTPUT:
Today I think I can make major progress in the following:
1. I can print out graduation form and sign it.
2. I can try out the local flow project as much as possible and get some usage statistics in.
3. I can get started on the response embedding clustering project.
"""

        prompt = f"{identity_purpose}\n\n{steps}\n\n{output_instructions}\n\n{example_1}\n{example_2}# INPUT:"
        logger.info(prompt)
        return prompt


class LocalFormatter(Formatter):
    def __init__(self):
        if not self.is_ollama_running():
            logger.error("Ollama is not running.")
            raise OllamaOfflineException()
        self.MODEL = "llama3.2"
        self.status: Literal["offline", "online"] = "offline"
        logger.info(f"Using model {self.MODEL}")
        super().__init__()

    def is_ollama_running(self):
        try:
            response = request(method="GET", url="http://localhost:11434")
            if response.status_code == 200:
                logger.info("Ollama is running")
                return True
            else:
                logger.error("Ollama is not running")
                return False
        except Exception as e:
            logger.error(f"Error checking Ollama status: {e}")
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
            keep_alive="15m",
            system=self.generate_system_prompt(),
            prompt=f"Please improve the following transcription:\n\n{raw_transcription}",
        )
        # logger.debug(response)
        result: str = response["response"]
        prompt_tokens = response["prompt_eval_count"]
        response_tokens = response["eval_count"]
        total_duration = response["total_duration"] / 10**9
        logger.info(result)
        logger.info(
            f"Tokens: Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {prompt_tokens + response_tokens}"
        )
        logger.info(f"Total duration: {total_duration:.2f} seconds")

        # if "improved transcription:" in result:
        #     result = result.split("improved transcription:")[1].strip().strip('"')
        #     logger.info("Removed 'improved transcription:'")
        # if "refined transcription:" in result:
        #     result = result.split("refined transcription:")[1].strip().strip('"')
        #     logger.info("Removed 'refined transcription:'")
        return result


if __name__ == "__main__":
    formatter = LocalFormatter()
    formatter.load_model()
    test_transcription = """Alright, so, uh... I was thinking about the vacation plans for next month. I mean, we still haven’t decided on the destination, but I’m kinda leaning toward Italy. Like, I keep hearing about how amazing the food is, and—oh!—those little towns with cobblestone streets? They sound so charming.

    But then again, there’s Spain. Uh, Barcelona, in particular. I’ve always wanted to see the Sagrada Familia in person. Hmm... decisions, decisions. Oh, and I guess we should also think about the budget. Flights are, like, super expensive right now, and we’ll probably want to stay somewhere decent, y'know?

    Oh! Another thing—activities. Should we focus on, like, sightseeing, or do we want more of a relaxing vibe? Maybe a mix of both? Gosh, there’s so much to figure out. Anyway, I’ll need to look up some options later and maybe ask a few friends who’ve been to those places for their recommendations.

    Okay, uh, that’s it for now. I’ll check back after I’ve done some research."""
    result = formatter.improve_transcription(test_transcription)

    test_transcription_2 = """ Let's give a little bit of a review of the day, I think that would be a good idea. What were the important parts of the day? I think the number one highlight has to be the coding. I made great progress, achieved great things on the local flow project and I'm very happy about that. Then, secondary, we need to talk about the stream that I watched. The stream, it was a great stream. I was positively surprised to even see it in the first place and the vibes were immaculate. It made me much more positive about their future compared to before. I had a bit of a gloomy perspective on it, but no more. And then finally, I think we should talk about the food part. I ate a lot today. Lots of protein, lots of carbs, but in general, a lot, even though it was a rest day. But remember, I am supposed to eat a lot on rest days as well, as part of the diet. As part of the measures to grow muscle."""
    result_2 = formatter.improve_transcription(test_transcription_2)

    print(test_transcription)
    print()
    print(result)
    print()
    print()
    print(test_transcription_2)
    print()
    print(result_2)
    print()
    print()
