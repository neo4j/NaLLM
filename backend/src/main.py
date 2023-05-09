import os

from fastapi import FastAPI
from components.text2cypher import Text2Cypher
from driver.neo4j import Neo4jDatabase
from llm.openai import OpenAIChat

neo4j_connection = Neo4jDatabase(
    host=os.environ.get("NEO4J_URL", "neo4j+s://22e1a7bd.databases.neo4j.io"),
    user=os.environ.get("NEO4J_USER", "neo4j"),
    password=os.environ.get(
        "NEO4J_PASS", "_K9HxEKmXWe2IZwI4L6jSSZmDyv-tf1Fcb7kv1T6Ey8")
)

openai_api_key = os.environ.get(
    "OPENAI_API_KEY", "")

llm = OpenAIChat(openai_api_key=openai_api_key, model_name="gpt-3.5-turbo")

text2cypher = Text2Cypher(database=neo4j_connection,
                          llm=llm,
                          schema=True,
                          cypher_examples="""
                          # I like Top Gun
                          MATCH (m:Movie {title:"Top Gun"})
                          MERGE (u:User {id:"Me"})
                          MERGE (u)-[:LIKE]->(m)
                          RETURN "Noted" AS result
                          """)

app = FastAPI()


@ app.get("/text2cypher")
async def root(question: str):
    if not question:
        return "missing question"
    try:
        return text2cypher.run(question)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
