import os
from api.ipc import print_message
import time
from typing import Literal, Optional
from httpx import request
from loguru import logger
from models.db import (
    Mode,
    Prompt,
)
from models.exceptions import OllamaOfflineException
from models.messages import TranscriptionMessage
from models.db import ActiveWindowContext, ApplicationContext
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


class AIProcessor:
    def __init__(self, mode: Mode) -> None:
        self.mode = mode
        if not mode.language_model:
            logger.error("No language model provided")
            raise ValueError("No language model provided")
        if not mode.prompt:
            logger.error("No prompt provided")
            raise ValueError("No prompt provided")
        self.language_model = mode.language_model
        self.prompt = mode.prompt

    def load_model(self, keep_alive_minutes="15"):
        ollama.generate(
            model=self.language_model.name,
            prompt="Wake up!",
            keep_alive=keep_alive_minutes + "m",
        )
        current_time = time.time()
        self.timeout = current_time + int(keep_alive_minutes) * 60
        logger.info(
            f"Activated {self.language_model.name} for {keep_alive_minutes} Minutes."
        )

    def unload_model(self):
        os.system(f"ollama stop {self.language_model.name}")
        logger.info(f"Deactivated formatting model {self.language_model.name}")

    def process(self, transcription: str) -> str:
        if not transcription:
            logger.info("No transcription provided")
            return ""

        complete_system_prompt = generate_prompt(self.prompt)

        logger.info(f"System Prompt: {complete_system_prompt}")
        logger.info(f"Prompt: {transcription}")

        stream = ollama.generate(
            model=self.language_model.name,
            system=complete_system_prompt,
            prompt=transcription,
            keep_alive="1m",
            stream=True,
        )

        message = ""
        for chunk in stream:
            content = chunk.response
            if content:
                message += content
                print_message(
                    "transcription", TranscriptionMessage(transcription=message)
                )

        prompt_tokens = chunk.prompt_eval_count
        response_tokens = chunk.eval_count
        if chunk.total_duration:
            total_duration = chunk.total_duration / 10**9
        else:
            total_duration = 0

        result = post_process_result(message)

        logger.info(result)
        if prompt_tokens and response_tokens:
            logger.info(
                f"Tokens: Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {prompt_tokens + response_tokens}"
            )
        logger.info(f"Total duration: {total_duration:.2f} seconds")

        return result


def post_process_result(result: str) -> str:
    return result.strip('"').strip()


def generate_prompt(prompt: Prompt) -> str:
    """Generates the prompt for the language model.

    Args:
        prompt (Prompt): The prompt object containing the system prompt and examples.

    Returns:
        str: The generated prompt.
    """
    joiner = "\n\n"
    prompt_items = [prompt.system_prompt]

    if len(prompt.examples) > 0:
        examples = "\n".join(
            [
                f'EXAMPLE {i + 1}:\n# "{example.input}"\n"{example.output}"'
                for i, example in enumerate(prompt.examples)
            ]
        )
        prompt_items.append(examples)

    if prompt.include_clipboard:
        # TODO: Implement clipboard functionality
        pass

    if prompt.include_active_window:
        # TODO: Implement active window functionality
        pass

    prompt_items.append("# INPUT:")
    return joiner.join(prompt_items)


# Old code
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

        example_1 = """RAW TRANSCRIPTION:
 What do I wish I could achieve today? I would like to do my weekly review of my tasks and just try to get my organization straight. What I don't want to do is work on Psycluster. That's not helpful. While it's fun and I enjoy it and it feels good, I need to postpone it. I did also have an idea of working on the local flow project. I could implement a groq a groq formatter and transcriber, which would be kind of cool. It would probably be a little bit more work and once again that is a side project. It can be part of the main process, but I need to be clear and conscious about that. 
 
FORMATTED TRANSCRIPTION:
Here is the improved transcription:

What do I wish I could achieve today? I'd like to conduct my weekly review of tasks and get my organization in order. I don't want to work on Psycluster right now; it's not a priority for me. While I enjoy it, I find it distracting. On a related note, I had an idea for the local flow project – implementing a groq formatter and transcriber would be a great addition.

Changes:
    - (fill out changes)"""

        example_2 = """RAW TRANSCRIPTION:
Okay, it's time to finally take a break at journal. I have been working relentlessly on the response clustering project these last couple of days. And I have made tremendous progress and I'm incredibly proud of it. However, I cannot ignore the fact that I have been neglecting everything else in my life. The truth is that I really enjoy this kind of work because it allows me to basically dominate my mind space in such a way that I don't think about anything else. And that is productive and it works and I get things done, but it's not healthy when you start neglecting other things. The truth is I've been pushing various tasks and I'm not exactly... progressing in my life's journey with the exception of this one project. But my ambition is high and I want to treasure that. I just wish I could find a more balanced schedule that properly respects my time and health while still fueling my ambition.

FORMATTED TRANSCRIPTION:
Here is the improved transcription:

Okay, it's finally time for me to take a break and journal. Over the past couple of days, I've been working intensely on the response clustering project, making tremendous progress and feeling incredibly proud of myself. However, I can't deny that I've been neglecting everything else in my life. The truth is, I really enjoy this kind of work because it allows me to focus my mind and minimize distractions, which leads to productivity and getting things done. But I know that's not healthy when it starts to take over my life. In reality, I've been pushing tasks aside and while I'm making progress on this project, I haven't made much headway in other areas of my life. Still, my ambition remains high, and I want to maintain that drive. What I wish is that I could find a more balanced schedule that respects both my time and health while still fueling my passion for this work.

Changes:
    - (fill out changes)"""

        example_3 = """RAW TRANSCRIPTION:
Today I woke up relatively early, at 8.45 I believe. I showered right away, before breakfast. Then had breakfast, then put on my gym clothes and just as I was about to leave, it started to rain and then snow actually, because it's quite cold. And so I changed my pants into my rain pants and then eventually I made my way outside. Something I want to note is that my headphones are broken. Like not completely broken, but the left one has quite some static noise. It definitely has like a, it feels like an old radio, if you know what I mean. It has that kind of noise where it sounds like static. That's also why I listen to some old 50s music during the gym. Unfortunately I also ended the gym session a bit early, like I didn't do the face pulls, because the machine was busy. Incidentally it was also my old teacher, so I definitely did not want to ask about working in or something. I'm trying to avoid that guy at all costs. But yeah, anyway, overall it was a good gym session. I'm proud of it. Took a long time in the bathroom, had to postpone shaving until after lunch. And from there on, I mean, I was just so tired. So low energy, I just didn't do anything. Which continued until I eventually took a nap at 6pm. 6pm. 6pm. Around 6pm I think. The nap actually really helped. I felt much better afterwards, which is right now.

FORMATTED TRANSCRIPTION:
Here is the improved transcription:

Today, I woke up relatively early, around 8:45. I showered immediately, followed by breakfast, and then got dressed in my gym clothes. As I was about to leave, it started raining, and soon snowing due to the cold weather. I changed into my rain pants and headed outside. 

One thing I'd like to mention is that my left headphone has a significant amount of static noise, similar to an old radio. That's why I listen to 1950s music during gym sessions. Unfortunately, I had to cut my workout short due to the busy gym equipment. It was also my old teacher, so I deliberately avoided interacting with him. Trying to steer clear of him has been a priority for me. Despite this, overall, it was a good gym session, and I'm proud of it. 

I spent extra time in the bathroom, delaying shaving until after lunch, and subsequently felt extremely tired. My energy levels were low, so I didn't do anything else. This continued until I took a nap around 6 pm. The nap actually helped me feel much better afterwards, which is now.

Changes:
    - (fill out changes)"""

        prompt = f"{identity_purpose}\n\n{steps}\n\n{output_instructions}\n\n{example_1}\n{example_2}\n{example_3}\n\n# INPUT:"
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
        if raw_transcription == "":
            logger.info("No transcription provided")
            return ""
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

        if "improved transcription:" in result:
            result = result.split("improved transcription:")[1].strip().strip('"')
            logger.info("Removed 'improved transcription:'")
        if "Changes:" in result:
            result = result.split("Changes:")[0].strip()
            logger.info("Removed 'Changes:'")
        return result
