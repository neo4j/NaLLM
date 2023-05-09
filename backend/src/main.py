import os

from fastapi import FastAPI
from components.text2cypher import Text2Cypher
from components.summarize_cypher_result import SummarizeCypherResult
from driver.neo4j import Neo4jDatabase
from llm.openai import OpenAIChat

neo4j_connection = Neo4jDatabase(
    host=os.environ.get("NEO4J_URL", "bolt://44.193.24.195:7687"),
    user=os.environ.get("NEO4J_USER", "neo4j"),
    password=os.environ.get(
        "NEO4J_PASS", "rivers-major-originators")
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

summarize_results = SummarizeCypherResult(llm=llm)

app = FastAPI()


@ app.get("/text2cypher")
async def root(question: str):
    """
    Takes an input and returns results from the database
    """
    if not question:
        return "missing question"
    try:
        return text2cypher.run(question)
    except Exception as e:
        return f"Error: {e}"


@ app.get("/text2text")
async def root(question: str):
    """
    Takes an input and returns natural language generate response
    """
    if not question:
        return "missing question"
    try:
        results = text2cypher.run(question)
        return {"output": summarize_results.run(question, results['output']), "generated_cypher": results['generated_cypher']}
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
