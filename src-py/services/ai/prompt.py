from loguru import logger
from models.db import Prompt


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
        logger.debug("Clipboard functionality not yet implemented")

    if prompt.include_active_window:
        # TODO: Implement active window functionality
        logger.debug("Active window functionality not yet implemented")

    prompt_items.append("# INPUT:")
    return joiner.join(prompt_items)
