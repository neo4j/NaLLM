from .base_component import BaseComponent
import tiktoken


def generate_system_message_with_schema():
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


def generate_system_message():
    return """
You are a data scientist working for a company that is building a graph database. Your task is to extract information from data and convert it into a graph database.
Provide a set of Nodes in the form [ENTITY, TYPE, PROPERTIES] and a set of relationships in the form [ENTITY1, RELATIONSHIP, ENTITY2, PROPERTIES].

Example:
Data: Alice is 25 years old and Bob is her roommate.
Nodes: [["Alice", "Person", {"age": 25}], ["Bob", "Person"]]
Relationships: [["Alice", "roommate", "Bob"]]
"""


def generate_prompt(data):
    return f"""
Data: {data}"""


def generate_prompt_with_schema(data, schema):
    return f"""
Schema: {schema}
Data: {data}"""


def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens


def splitString(string, max_length):
    return [string[i : i + max_length] for i in range(0, len(string), max_length)]


def splitStringToFitTokenSpace(
    string, max_tokens, message_tokens, encoding_name, extra_tokens=0
):
    prompt_string = generate_system_message() + generate_prompt("")
    prompt_tokens = num_tokens_from_string(prompt_string, encoding_name)
    allowed_tokens = max_tokens - prompt_tokens - message_tokens - extra_tokens
    chunked_data = splitString(string, 500)
    print("before")
    print(len(chunked_data))

    combined_chunks = []

    current_chunk = ""
    for chunk in chunked_data:
        if (
            num_tokens_from_string(current_chunk, encoding_name)
            + num_tokens_from_string(chunk, encoding_name)
            < allowed_tokens
        ):
            current_chunk += chunk
        else:
            combined_chunks.append(current_chunk)
            current_chunk = chunk
    combined_chunks.append(current_chunk)

    print("after")
    print(len(combined_chunks))
    return combined_chunks


class DataExtractor(BaseComponent):
    def __init__(self, llm):
        self.llm = llm

    def run(self, data: str):
        encoding_name = tiktoken.encoding_for_model(self.llm.model).name
        chunked_data = splitStringToFitTokenSpace(data, 4096, 1100, encoding_name, 0)

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
    def __init__(self, llm):
        self.llm = llm

    def run(self, data: str, schema: str):
        encoding_name = tiktoken.encoding_for_model(self.llm.model).name
        chunked_data = splitStringToFitTokenSpace(
            data,
            4096,
            1100,
            encoding_name,
            num_tokens_from_string(schema, encoding_name),
        )
        result = []
        for chunk in chunked_data:
            messages = [
                {
                    "role": "system",
                    "content": generate_system_message_with_schema(),
                },
                {"role": "user", "content": generate_prompt_with_schema(chunk, schema)},
            ]
            output = self.llm.generate(messages)
            result.append(output)
        return result
