
node_properties_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE NOT type = "RELATIONSHIP" AND elementType = "node"
WITH label AS nodeLabels, collect(property) AS properties
RETURN {labels: nodeLabels, properties: properties} AS output

"""

rel_properties_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE NOT type = "RELATIONSHIP" AND elementType = "relationship"
WITH label AS nodeLabels, collect(property) AS properties
RETURN {type: nodeLabels, properties: properties} AS output
"""

rel_query = """
CALL apoc.meta.data()
YIELD label, other, elementType, type, property
WHERE type = "RELATIONSHIP" AND elementType = "node"
RETURN {source: label, relationship: property, target: other} AS output
"""


def schema_text(node_props, rel_props, rels):
    return f"""
  This is the schema representation of the Neo4j database.
  Node properties are the following:
  {node_props}
  Relationship properties are the following:
  {rel_props}
  Relationship point from source to target nodes
  {rels}
  Make sure to respect relationship types and directions
  """


class Text2Cypher():
    def __init__(self, llm, database, schema: bool, cypher_examples: str):
        self.llm = llm
        self.database = database
        self.cypher_examples = cypher_examples
        self.schema = ""

        if schema:
            self.schema = self.generate_schema()

    def get_system_message(self):
        system = """
        Task: Generate Cypher queries to query a Neo4j graph database.
        Instructions:
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
                     Do not include any text except the generated Cypher statement.
                     """
        print(system)
        return system

    def generate_schema(self):
        node_props = [el["output"]
                      for el in self.database.query(node_properties_query)]
        rel_props = [el["output"]
                     for el in self.database.query(rel_properties_query)]
        rels = [el["output"] for el in self.database.query(rel_query)]
        schema = schema_text(node_props, rel_props, rels)
        return schema

    def construct_cypher(self, question):
        messages = [
            {"role": "system", "content": self.get_system_message()},
            {"role": "user", "content": question},
        ]
        cypher = self.llm.generate(messages)
        return cypher

    def run(self, question):
        cypher = self.construct_cypher(question)
        print(cypher)
        try:
            return {"output": self.database.query(cypher),
                    "generated_cypher": cypher}
        except Exception as e:
            print(e)
