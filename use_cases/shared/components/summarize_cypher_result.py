import asyncio
from typing import Awaitable, Callable, Dict, Any
from .base_component import BaseComponent
from use_cases.shared.llm.basellm import BaseLLM


system = f"""
You are an assistant that helps to generate text to form nice and human understandable answers based.
The latest prompt contains the information, and you need to generate a human readable response based on the given information.
Make the answer sound as a response to the question. Do not mention that you based the result on the given information.
Do not add any additional information that is not explicitly provided in the latest prompt.
I repeat, do not add any information that is not explicitly given.
"""


def generate_user_prompt(question, results) -> str:
    return f"""
    The question was {question}
    Answer the question by using the following results:
    {results}
    """


class SummarizeCypherResult(BaseComponent):
    llm: BaseLLM

    def __init__(self, llm) -> None:
        self.llm = llm

    def run(
        self,
        question,
        results,
    ) -> Dict[str, str]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": generate_user_prompt(question, results)},
        ]

        output = self.llm.generate(messages)
        return output

    async def run_async(
        self,
        question,
        results,
        callback: Callable[[str], Awaitable[Any]] = None,
    ) -> Dict[str, str]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": generate_user_prompt(question, results)},
        ]
        output = await self.llm.generateStreaming(messages, onTokenCallback=callback)
        return "".join(output)
