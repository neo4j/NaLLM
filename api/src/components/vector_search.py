from typing import Dict, List, Union

from components.base_component import BaseComponent
from driver.neo4j import Neo4jDatabase


def construct_cypher(label, property, k) -> str:
    return f"""
    MATCH (n:`{label}`)
    WHERE n.`{property}` IS NOT NULL
    WITH n, gds.similarity.cosine($input_vector, n.`{property}`) AS similarity
    ORDER BY similarity DESC
    LIMIT {k}
    RETURN apoc.map.removeKey(properties(n), "{property}") AS output
    """


class VectorSearch(BaseComponent):
    def __init__(
        self, database: Neo4jDatabase, label: str, property: str, k: int
    ) -> None:
        self.database = database
        self.generated_cypher = construct_cypher(label, property, k)

    def run(self, input: str) -> Dict[str, Union[str, List[Dict[str, str]]]]:
        try:
            return {
                "output": [
                    str(el["output"])
                    for el in self.database.query(
                        self.generated_cypher, {"input_vector": input}
                    )
                ],
                "generated_cypher": self.generated_cypher,
            }
        except Exception as e:
            return e
