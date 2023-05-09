from typing import List, Optional, Dict

from neo4j import GraphDatabase

from logger import logger


class Neo4jDatabase:
    def __init__(self, host: str = "neo4j://localhost:7687",
                 user: str = "neo4j",
                 password: str = "pleaseletmein"):
        """Initialize a neo4j database"""
        self._driver = GraphDatabase.driver(host, auth=(user, password))
        # Add a test for connection

    def query(
        self,
        cypher_query: str,
        params: Optional[Dict] = {}
    ) -> List[Dict[str, str]]:
        with self._driver.session() as session:
            result = session.run(cypher_query, params)
            # Limit to at most 50 results
            return [r.data() for r in result]
