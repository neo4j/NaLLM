from abc import ABC, abstractmethod
from typing import Union, List


class BaseComponent(ABC):
    """"""
    @abstractmethod
    async def run(
        self,
        input: Union[str, List[float]],
    ) -> str:
        """Comment"""
