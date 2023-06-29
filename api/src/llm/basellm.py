from abc import ABC, abstractmethod
from typing import (
    Any,
    List,
)


def raise_(ex):
    raise ex


class BaseLLM(ABC):
    """LLM wrapper should take in a prompt and return a string."""

    @abstractmethod
    def generate(self, messages: List[str]) -> str:
        """Comment"""

    @abstractmethod
    async def generateStreaming(
        self, messages: List[str], onTokenCallback
    ) -> List[Any]:
        """Comment"""

    @abstractmethod
    async def num_tokens_from_string(
        self,
        string: str,
    ) -> str:
        """Given a string returns the number of tokens the given string consists of"""

    @abstractmethod
    async def max_allowed_token_length(
        self,
    ) -> int:
        """Returns the maximum number of tokens the LLM can handle"""
