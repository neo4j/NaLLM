from typing import Any, Awaitable, Callable, Dict, List

from components.base_component import BaseComponent
from llm.basellm import BaseLLM

system = f"""
You are an assistant that helps to generate text to form nice and human understandable answers based.
The latest prompt contains the information, and you need to generate a human readable response based on the given information.
Make the answer sound as a response to the question. Do not mention that you based the result on the given information.
Do not add any additional information that is not explicitly provided in the latest prompt.
I repeat, do not add any information that is not explicitly given.
Make the answer as concise as possible and do not use more than 50 words.
"""


def remove_large_lists(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    The idea is to remove all properties that have large lists (embeddings) or text as values
    """
    LIST_CUTOFF = 56
    CHARACTER_CUTOFF = 5000
    # iterate over all key-value pairs in the dictionary
    for key, value in d.items():
        # if the value is a list and has more than list cutoff elements
        if isinstance(value, list) and len(value) > LIST_CUTOFF:
            d[key] = None
        # if the value is a string and has more than list cutoff elements
        if isinstance(value, str) and len(value) > CHARACTER_CUTOFF:
            d[key] = d[key][:CHARACTER_CUTOFF]
        # if the value is a dictionary
        elif isinstance(value, dict):
            # recurse into the nested dictionary
            remove_large_lists(d[key])
    return d


class SummarizeCypherResult(BaseComponent):
    llm: BaseLLM
    exclude_embeddings: bool

    def __init__(self, llm: BaseLLM, exclude_embeddings: bool = True) -> None:
        self.llm = llm
        self.exclude_embeddings = exclude_embeddings

    def generate_user_prompt(self, question: str, results: List[Dict[str, str]]) -> str:
        return f"""
        The question was {question}
        Answer the question by using the following results:
        {[remove_large_lists(el) for el in  results] if self.exclude_embeddings else results}
        """

    def run(
        self,
        question: str,
        results: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": self.generate_user_prompt(question, results)},
        ]

        output = self.llm.generate(messages)
        return output

    async def run_async(
        self,
        question: str,
        results: List[Dict[str, Any]],
        callback: Callable[[str], Awaitable[Any]] = None,
    ) -> Dict[str, str]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": self.generate_user_prompt(question, results)},
        ]
        output = await self.llm.generateStreaming(messages, onTokenCallback=callback)
        return "".join(output)
