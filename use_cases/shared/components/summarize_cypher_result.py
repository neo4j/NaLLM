from typing import Dict

from .base_component import BaseComponent

system = f"""
You are an assistant that helps to generate text to form nice and human understandable answers based.
The latest prompt contains the information, and you need to generate a human readable response based on the given information.
Make it sound like the information are coming from an AI assistant, but don't add any information.
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
    def __init__(self, llm) -> None:
        self.llm = llm

    def run(self, question, results) -> Dict[str, str]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": generate_user_prompt(
                question, results)},
        ]
        print(messages)
        output = self.llm.generate(messages)
        print(output)
        return output
