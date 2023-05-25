import openai
from retry import retry
from typing import (
    List,
)

from .basellm import BaseLLM


class OpenAIChat(BaseLLM):
    """Wrapper around OpenAI Chat large language models.
    """

    def __init__(self, openai_api_key: str, model_name: str = "gpt-3.5-turbo") -> None:
        openai.api_key = openai_api_key
        self.model = model_name

    retry(tries=3, delay=1)
    def generate(
        self,
        messages: List[str],
    ) -> str:
        try:
            completions = openai.ChatCompletion.create(
                model=self.model,
                temperature=0.0,
                max_tokens=1000,
                messages=messages
            )
            print(completions)
            return completions.choices[0].message.content
        # catch context length / do not retry
        except openai.error.InvalidRequestError as e:
            return str(f"Error: {e}")
        # catch authorization errors / do not retry
        except openai.error.AuthenticationError as e:
            return "Error: The provided OpenAI API key is invalid"
        except Exception as e:
            print(f"Retrying LLM call {e}")
            raise Exception()

