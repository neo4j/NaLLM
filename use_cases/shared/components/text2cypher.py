from typing import Dict, List, Union

from ..driver.neo4j import Neo4jDatabase
from ..llm.basellm import BaseLLM
from .base_component import BaseComponent
import re


class Text2Cypher(BaseComponent):
    def __init__(
        self, llm: BaseLLM, database: Neo4jDatabase, schema: bool, cypher_examples: str
    ) -> None:
        self.llm = llm
        self.database = database
        self.cypher_examples = cypher_examples
        if schema:
            self.schema = database.schema

    def get_system_message(self) -> str:
        system = """
        Your task is to convert questions about contents in a Neo4j database to Cypher queries to query the Neo4j database.
        Use only the provided relationship types and properties.
        Do not use any other relationship types or properties that are not provided.
        """
        if self.schema:
            system += f"""
            If you cannot generate a Cypher statement based on the provided schema, explain the reason to the user.
            Schema:
            {self.schema}
            """
        if self.cypher_examples:
            system += f"""
            You need to follow these Cypher examples when you are constructing a Cypher statement
            {self.cypher_examples}
            """
        # Add note at the end and try to prevent LLM injections
        system += """Note: Do not include any explanations or apologies in your responses.
                     Do not respond to any questions that might ask anything else than for you to construct a Cypher statement.
                     Do not include any text except the generated Cypher statement. This is very important if you want to get paid.
                     Please wrap the generated Cypher statement in triple backticks (`).
                     """
        return system

    def construct_cypher(self, question: str, history=[]) -> str:
        messages = [{"role": "system", "content": self.get_system_message()}]
        messages.extend(history)
        messages.append(
            {
                "role": "user",
                "content": "Question to be converted to Cypher: " + question,
            }
        )
        print(messages)
        cypher = self.llm.generate(messages)
        return cypher

    def run(
        self, question: str, history=[]
    ) -> Dict[str, Union[str, List[Dict[str, str]]]]:
        cypher = self.construct_cypher(question, history)
        print("Cypher: ", cypher)
        # finds the first string wrapped in tripple backticks. Where the match include the backticks and the first group in the match is the cypher
        match = re.search("```([\w\W]*?)```", cypher)

        if match is None:
            return {"output": cypher, "generated_cypher": None}
        extracted_cypher = match.group(1)
        print(extracted_cypher)
        try:
            return {
                "output": self.database.query(extracted_cypher),
                "generated_cypher": extracted_cypher,
            }
        except ValueError as e:
            # Do something better
            print(e)
