from typing import Any, Dict, List, Union

from components.base_component import BaseComponent
from driver.neo4j import Neo4jDatabase
from llm.basellm import BaseLLM
import re


class QuestionProposalGenerator(BaseComponent):
    def __init__(
        self,
        llm: BaseLLM,
        database: Neo4jDatabase,
    ) -> None:
        self.llm = llm
        self.database = database

    def get_system_message(self) -> str:
        system = f"""
        Your task is to come up with questions someone might as about the content of a Neo4j database. Try to make the questions as different as possible.
        The questions should be separated by a new line and each line should only contain one question.
        To do this, you need to understand the schema of the database. Therefore it's very important that you read the schema carefully. You can find the schema below.
        Schema: 
        {self.database.schema}
        """

        return system

    def get_database_sample(self) -> str:
        return self.database.query(
            """MATCH (n)
                WITH n
                WHERE rand() < 0.3
                RETURN apoc.map.removeKey(n, 'embedding') AS properties, LABELS(n) as labels
                LIMIT 5"""
        )

    def run(self) -> Dict[str, Union[str, List[Dict[str, Any]]]]:
        messages = [{"role": "system", "content": self.get_system_message()}]
        sample = self.get_database_sample()
        messages.append(
            {
                "role": "user",
                "content": f"""Please generate 5 questions about the content of the database. Here is a sample of the database you can use when generating questions: {sample}""",
            }
        )
        print(messages)
        questionsString = self.llm.generate(messages)
        questions = [
            # remove number and dot from the beginning of the question
            re.sub(r"\A\d\.?\s*", "", question)
            for question in questionsString.split("\n")
        ]
        return {
            "output": questions,
        }
