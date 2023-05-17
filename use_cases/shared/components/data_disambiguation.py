from typing import List
from .base_component import BaseComponent


def generate_system_message():
    return f"""
Your task is to identify if there are duplicated nodes and relationships and if so merge them into one node or relationship. only merge the nodes and relationships that refer to the same entity.
You will be given different datasets of nodes and relationships some of these nodes and relationships may be duplicated or refer to the same entity. 
The datasets contains nodes in the form [ENTITY, TYPE, PROPERTIES] and a set of relationships in the form [ENTITY1, RELATIONSHIP, ENTITY2, PROPERTIES]. When you have completed your task please give me the 
resulting nodes and relationships in the same format. Only return the nodes and relationships no other text.
"""


def generate_prompt(data):
    return f""" Here is the data:
{data}
"""


class DataDisambiguation(BaseComponent):
    def __init__(self, llm):
        self.llm = llm

    def run(self, data: List[str]):
        messages = [
            {"role": "system", "content": generate_system_message()},
            {"role": "user", "content": generate_prompt(data)},
        ]
        output = self.llm.generate(messages)
        return output
