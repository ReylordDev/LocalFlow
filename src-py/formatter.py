import os
import time
from dotenv import load_dotenv
from httpx import request
from loguru import logger
from models import ApplicationContext, Result, WindowsResult, LinuxResult, MacOSResult


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
        self.active_window = None

    def improve_transcription(self, raw_transcription: str):
        raise NotImplementedError

    def get_language(self):
        return self.language

    def set_language(self, language: str | None):
        self.language = language

    def get_active_window(self) -> Result | None:
        return self.active_window

    def set_active_window(self, active_window: Result | None):
        self.active_window = active_window

    def get_application_context(self):
        active_window = self.get_active_window()
        if not active_window:
            logger.info("No active window found")
            return None

        active_window = active_window.root
        if (
            isinstance(active_window, WindowsResult)
            or isinstance(active_window, MacOSResult)
            or isinstance(active_window, LinuxResult)
        ):
            return ApplicationContext(
                name=active_window.owner.name,
                title=active_window.title,
            )

        logger.info("Active window is bad")
        logger.info(active_window)
        return None

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
            "Notion": "- Format the text for Notion using markdown (headings, lists, bullet points). Split the text into paragraphs using double line breaks.",
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

        example = """# EXAMPLE

        INPUT:Okay, so, um... today’s meeting was pretty productive, I think. Uh, we talked about the main deliverables for the next quarter. Oh, and—right—I have to remember to send out the slides. Uh, let me make a note of that.

        Also, Sarah mentioned that the budget for the project might be tighter than we thought, so I should probably follow up with her to confirm. Hm... oh, and during the brainstorming session, uh, Mike brought up this really interesting idea about automating some of the reporting tasks. I think we should explore that more.

        What else? Oh yeah—team morale seems good overall, but I do think we need to schedule another check-in soon, just to, y'know, keep everyone aligned. Okay, uh, that’s about it for now, I guess. I’ll review this later and organize my notes better

        OUTPUT:
        Here's the improved transcription:
        
        "Today's meeting was productive. We discussed the main deliverables for the next quarter. I should also send out the slides soon.
        
        Sarah mentioned that the project budget may be tighter than than we thought, so I should probably follow up with her to confirm. During the brainstorming session, Mike shared an interesting idea about automating reporting tasks – we should explore this further.
        
        Additionally, while team morale seems good overall, I think we should schedule another check-in soon to keep everyone aligned. That's my summary of the meeting for now; I'll review and organize my notes later."
        """

        prompt = f"{identity_purpose}\n\n{steps}\n\n{output_instructions}\n\n# INPUT:"
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
        result: str = response["response"]
        prompt_tokens = response["prompt_eval_count"]
        response_tokens = response["eval_count"]
        total_duration = response["total_duration"] / 10**9
        logger.info(result)
        logger.info(
            f"Tokens: Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {prompt_tokens + response_tokens}"
        )
        logger.info(f"Total duration: {total_duration:.2f} seconds")

        if "improved transcription:" in result:
            result = result.split("improved transcription:")[1].strip().strip('"')
            logger.info("Removed 'improved transcription:'")
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
    test_transcription = """Alright, so, uh... I was thinking about the vacation plans for next month. I mean, we still haven’t decided on the destination, but I’m kinda leaning toward Italy. Like, I keep hearing about how amazing the food is, and—oh!—those little towns with cobblestone streets? They sound so charming.

    But then again, there’s Spain. Uh, Barcelona, in particular. I’ve always wanted to see the Sagrada Familia in person. Hmm... decisions, decisions. Oh, and I guess we should also think about the budget. Flights are, like, super expensive right now, and we’ll probably want to stay somewhere decent, y'know?

    Oh! Another thing—activities. Should we focus on, like, sightseeing, or do we want more of a relaxing vibe? Maybe a mix of both? Gosh, there’s so much to figure out. Anyway, I’ll need to look up some options later and maybe ask a few friends who’ve been to those places for their recommendations.

    Okay, uh, that’s it for now. I’ll check back after I’ve done some research."""
    result = formatter.improve_transcription(test_transcription)

    test_transcription_2 = """ Let's give a little bit of a review of the day, I think that would be a good idea. What were the important parts of the day? I think the number one highlight has to be the coding. I made great progress, achieved great things on the local flow project and I'm very happy about that. Then, secondary, we need to talk about the stream that I watched. The stream, it was a great stream. I was positively surprised to even see it in the first place and the vibes were immaculate. It made me much more positive about their future compared to before. I had a bit of a gloomy perspective on it, but no more. And then finally, I think we should talk about the food part. I ate a lot today. Lots of protein, lots of carbs, but in general, a lot, even though it was a rest day. But remember, I am supposed to eat a lot on rest days as well, as part of the diet. As part of the measures to grow muscle."""
    result_2 = formatter.improve_transcription(test_transcription_2)

    test_transcription_3 = """ Alright, so today I started the day quite early at 8am, and, oh actually I slept in a little bit. I woke up a quarter to nine, I think. Regardless, the timing does not really matter. I spent a lot of time coding, especially before breakfast, but also a little bit after breakfast. And I implemented a bunch of features for the local flow project. I'm very happy with the progress and the results. Then later I noticed that there was an AC stream with Mr. Arthur quite late yesterday. It was during the night for me and for Mr. Arthur. Honestly, I watched the entire stream, and I want to say it's kind of... shifted my view on things, you know. I was a bit down. I thought, you know, things were looking gloomy, perhaps I could say. But this stream was great. You know, it was soft farming. It was nice. It felt natural. So, you know what? We're still back."""

    result_3 = formatter.improve_transcription(test_transcription_3)

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
    print(test_transcription_3)
    print()
    print(result_3)
