from abc import ABC, abstractmethod


class BaseEmbedding(ABC):
    """"""

    @abstractmethod
    async def generate(
        self,
        input: str,
    ) -> str:
        """Comment"""
