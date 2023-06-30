from typing import Any, Dict, List, Optional

from neo4j import GraphDatabase, exceptions

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
    def __init__(
        self,
        host: str = "neo4j://localhost:7687",
        user: str = "neo4j",
        password: str = "pleaseletmein",
        database: str = "neo4j",
        read_only: bool = True,
    ) -> None:
        """Initialize a neo4j database"""
        self._driver = GraphDatabase.driver(host, auth=(user, password))
        self._database = database
        self._read_only = read_only
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
        try:
            self.refresh_schema()
        except:
            raise ValueError("Missing APOC Core plugin")

    @staticmethod
    def _execute_read_only_query(tx, cypher_query: str, params: Optional[Dict] = {}):
        result = tx.run(cypher_query, params)
        return [r.data() for r in result]

    def query(
        self, cypher_query: str, params: Optional[Dict] = {}
    ) -> List[Dict[str, Any]]:
        with self._driver.session(database=self._database) as session:
            try:
                if self._read_only:
                    result = session.read_transaction(
                        self._execute_read_only_query, cypher_query, params
                    )
                    return result
                else:
                    result = session.run(cypher_query, params)
                    # Limit to at most 10 results
                    return [r.data() for r in result]

            # Catch Cypher syntax errors
            except exceptions.CypherSyntaxError as e:
                return [
                    {
                        "code": "invalid_cypher",
                        "message": f"Invalid Cypher statement due to an error: {e}",
                    }
                ]

            except exceptions.ClientError as e:
                # Catch access mode errors
                if e.code == "Neo.ClientError.Statement.AccessMode":
                    return [
                        {
                            "code": "error",
                            "message": "Couldn't execute the query due to the read only access to Neo4j",
                        }
                    ]
                else:
                    return [{"code": "error", "message": e}]

    def refresh_schema(self) -> None:
        node_props = [el["output"] for el in self.query(node_properties_query)]
        rel_props = [el["output"] for el in self.query(rel_properties_query)]
        rels = [el["output"] for el in self.query(rel_query)]
        schema = schema_text(node_props, rel_props, rels)
        self.schema = schema
        print(schema)

    def check_if_empty(self) -> bool:
        data = self.query(
            """
        MATCH (n)
        WITH count(n) as c
        RETURN CASE WHEN c > 0 THEN true ELSE false END AS output
        """
        )
        return data[0]["output"]
