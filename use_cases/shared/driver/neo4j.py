from typing import List, Optional, Dict

from neo4j import GraphDatabase, exceptions

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
RETURN "(:" + label + ")-[:" + property + "]->(:" + toString(other[0]) + ")" AS output
"""


def schema_text(node_props, rel_props, rels) -> str:
    return f"""
  This is the schema representation of the Neo4j database.
  Node properties are the following:
  {node_props}
  Relationship properties are the following:
  {rel_props}
  The relationships are the following
  {rels}
  """


class Neo4jDatabase:
    def __init__(self, host: str = "neo4j://localhost:7687",
                 user: str = "neo4j",
                 password: str = "pleaseletmein",
                 database: str = "neo4j") -> None:
        """Initialize a neo4j database"""
        self._driver = GraphDatabase.driver(host, auth=(user, password))
        self._database = database
        self.schema = ""
        # Verify connection
        try:
            self._driver.verify_connectivity()
        except exceptions.ServiceUnavailable:
            raise ValueError(
                "Could not connect to Neo4j database. "
                "Please ensure that the url is correct"
            )
        except exceptions.AuthError:
            raise ValueError(
                "Could not connect to Neo4j database. "
                "Please ensure that the username and password are correct"
            )
        self.refresh_schema()

    def query(
        self,
        cypher_query: str,
        params: Optional[Dict] = {}
    ) -> List[Dict[str, str]]:
        with self._driver.session() as session:
            try:
                result = session.run(cypher_query, params)
                # Limit to at most 50 results
                return [r.data() for r in result][:50]
            except exceptions.CypherSyntaxError as e:
                raise ValueError(e)



    def refresh_schema(self) -> None:
        node_props = [el["output"]
                      for el in self.query(node_properties_query)]
        rel_props = [el["output"]
                     for el in self.query(rel_properties_query)]
        rels = [el["output"] for el in self.query(rel_query)]
        schema = schema_text(node_props, rel_props, rels)
        self.schema = schema
        print(schema)

    def check_if_empty(self) -> bool:
        data = self.query("""
        MATCH (n)
        WITH count(n) as c
        RETURN CASE WHEN c > 0 THEN true ELSE false END AS output
        """)
        return data[0]["output"]
