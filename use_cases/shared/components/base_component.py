from abc import ABC, abstractmethod
from typing import Callable, Union, List


class BaseComponent(ABC):
    """"""

    @abstractmethod
    def run(
        self,
        input: Union[str, List[float]],
    ) -> str:
        """Comment"""

    def run_async(
        self,
        input: Union[str, List[float]],
    ) -> str:
        """Comment"""
