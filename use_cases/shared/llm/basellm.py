from abc import ABC, abstractmethod
from typing import (
    List,
)


class BaseLLM(ABC):
    """LLM wrapper should take in a prompt and return a string."""
    @abstractmethod
    async def generate(
        self,
        messages: List[str],
    ) -> str:
        """Comment"""
