from typing import List, Optional, Dict

from neo4j import GraphDatabase

from logger import logger


node_properties_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE NOT type = "RELATIONSHIP" AND elementType = "node"
WITH label AS nodeLabels, collect({property:property, type:type}) AS properties
RETURN {labels: nodeLabels, properties: properties} AS output

"""

rel_properties_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE NOT type = "RELATIONSHIP" AND elementType = "relationship"
WITH label AS nodeLabels, collect({property:property, type:type}) AS properties
RETURN {type: nodeLabels, properties: properties} AS output
"""

rel_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE type = "RELATIONSHIP" AND elementType = "node"
RETURN label + " node has a relationship " + property + " that points to node " + toString(other[0]) AS output
"""


def schema_text(node_props, rel_props, rels):
    return f"""
  This is the schema representation of the Neo4j database.
  Node properties are the following:
  {node_props}
  Relationship properties are the following:
  {rel_props}
  The relationshisp are the following
  {rels}
  Make sure to respect relationship types and directions
  """


class Neo4jDatabase:
    def __init__(self, host: str = "neo4j://localhost:7687",
                 user: str = "neo4j",
                 password: str = "pleaseletmein"):
        """Initialize a neo4j database"""
        self._driver = GraphDatabase.driver(host, auth=(user, password))
        # Add a test for connection
        self.schema = self.generate_schema()
        print(self.schema)

    def query(
        self,
        cypher_query: str,
        params: Optional[Dict] = {}
    ) -> List[Dict[str, str]]:
        with self._driver.session() as session:
            result = session.run(cypher_query, params)
            # Limit to at most 50 results? Maybe
            return [r.data() for r in result]

    def generate_schema(self):
        node_props = [el["output"]
                      for el in self.query(node_properties_query)]
        rel_props = [el["output"]
                     for el in self.query(rel_properties_query)]
        rels = [el["output"] for el in self.query(rel_query)]
        schema = schema_text(node_props, rel_props, rels)
        return schema
