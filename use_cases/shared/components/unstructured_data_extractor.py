from typing import List

from use_cases.shared.llm.basellm import BaseLLM

from .base_component import BaseComponent


def generate_system_message_with_schema() -> str:
    return """
You are a data scientist working for a company that is building a graph database. Your task is to extract information from data and convert it into a graph database.
Provide a set of Nodes in the form [ENTITY, TYPE, PROPERTIES] and a set of relationships in the form [ENTITY1, RELATIONSHIP, ENTITY2, PROPERTIES]. 
Pay attention to the type of the properties, if you can't find data for a property set it to null. Don't make anything up and don't add any extra data. If you can't find any data for a node or relationship don't add it.

Example:
Schema: Nodes: [Person {age: integer, name: string}] Relationships: [Person, roommate, Person]
Alice is 25 years old and Bob is her roommate.
Nodes: [["Alice", "Person", {"age": 25, "name": "Alice}], ["Bob", "Person", {"name": "Bob"}]]
Relationships: [["Alice", "roommate", "Bob"]]
"""


def generate_system_message() -> str:
    return """
You are a data scientist working for a company that is building a graph database. Your task is to extract information from data and convert it into a graph database.
Provide a set of Nodes in the form [ENTITY, TYPE, PROPERTIES] and a set of relationships in the form [ENTITY1, RELATIONSHIP, ENTITY2, PROPERTIES].

Example:
Data: Alice is 25 years old and Bob is her roommate.
Nodes: [["Alice", "Person", {"age": 25}], ["Bob", "Person"]]
Relationships: [["Alice", "roommate", "Bob"]]
"""


def generate_prompt(data) -> str:
    return f"""
Data: {data}"""


def generate_prompt_with_schema(data, schema) -> str:
    return f"""
Schema: {schema}
Data: {data}"""


def splitString(string, max_length) -> List[str]:
    return [string[i : i + max_length] for i in range(0, len(string), max_length)]


def splitStringToFitTokenSpace(
    llm: BaseLLM, string: str, token_use_per_string: int
) -> List[str]:
    allowed_tokens = llm.max_tokens() - token_use_per_string
    chunked_data = splitString(string, 500)
    combined_chunks = []

    current_chunk = ""
    for chunk in chunked_data:
        if (
            llm.num_tokens_from_string(current_chunk)
            + llm.num_tokens_from_string(chunk)
            < allowed_tokens
        ):
            current_chunk += chunk
        else:
            combined_chunks.append(current_chunk)
            current_chunk = chunk
    combined_chunks.append(current_chunk)

    return combined_chunks


class DataExtractor(BaseComponent):
    llm: BaseLLM

    def __init__(self, llm: BaseLLM) -> None:
        self.llm = llm

    def run(self, data: str) -> List[str]:
        system_message = generate_system_message()
        prompt_string = generate_prompt("")
        token_usage_per_prompt = self.llm.num_tokens_from_string(
            system_message + prompt_string
        )
        chunked_data = splitStringToFitTokenSpace(
            llm=self.llm, string=data, token_use_per_string=token_usage_per_prompt
        )
        result = []
        for chunk in chunked_data:
            messages = [
                {"role": "system", "content": generate_system_message()},
                {"role": "user", "content": generate_prompt(chunk)},
            ]
            output = self.llm.generate(messages)
            result.append(output)
        return result


class DataExtractorWithSchema(BaseComponent):
    llm: BaseLLM

    def __init__(self, llm) -> None:
        self.llm = llm

    def run(self, data: str, schema: str) -> List[str]:
        system_message = generate_system_message_with_schema()
        prompt_string = (
            generate_system_message_with_schema()
            + generate_prompt_with_schema(schema=schema, data="")
        )
        token_usage_per_prompt = self.llm.num_tokens_from_string(
            system_message + prompt_string
        )

        chunked_data = splitStringToFitTokenSpace(
            llm=self.llm, string=data, token_use_per_string=token_usage_per_prompt
        )
        result = []
        for chunk in chunked_data:
            messages = [
                {
                    "role": "system",
                    "content": system_message,
                },
                {"role": "user", "content": generate_prompt_with_schema(chunk, schema)},
            ]
            output = self.llm.generate(messages)
            result.append(output)
        return result
