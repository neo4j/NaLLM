import openai
from typing import (
    List,
)

from .basellm import BaseLLM


class OpenAIChat(BaseLLM):
    """Wrapper around OpenAI Chat large language models.
    """

    def __init__(self, openai_api_key: str, model_name: str = "gpt-3.5-turbo"):
        openai.api_key = openai_api_key
        self.model = model_name

    def generate(
        self,
        messages: List[str],
    ) -> str:
        completions = openai.ChatCompletion.create(
            model=self.model,
            temperature=0.0,
            max_tokens=1000,
            messages=messages
        )
        print(completions)
        return completions.choices[0].message.content
