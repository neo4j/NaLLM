import openai
from typing import (
    List,
)

from .base_embedding import BaseEmbedding


class OpenAIEmbedding(BaseEmbedding):
    """Wrapper around OpenAI embedding models.
    """

    def __init__(self, openai_api_key: str, model_name: str = "text-embedding-ada-002") -> None:
        openai.api_key = openai_api_key
        self.model = model_name

    def generate(
        self,
        input: str,
    ) -> List[float]:
        embedding = openai.Embedding.create(input=input, model=self.model)
        return embedding["data"][0]["embedding"]
