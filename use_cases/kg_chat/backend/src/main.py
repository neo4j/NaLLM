import sys
import os
from pathlib import Path

current_file = Path(__file__).resolve()
project_root = current_file.parents[4]
sys.path.append(str(project_root))

from fastapi import FastAPI
from use_cases.shared.llm.openai import OpenAIChat
from use_cases.shared.driver.neo4j import Neo4jDatabase
from use_cases.shared.components.summarize_cypher_result import SummarizeCypherResult
from use_cases.shared.components.text2cypher import Text2Cypher
from use_cases.shared.components.vector_search import VectorSearch
from use_cases.shared.embedding.openai import OpenAIEmbedding

neo4j_connection = Neo4jDatabase(
    host=os.environ.get("NEO4J_URL", "bolt://54.156.128.31:7687"),
    user=os.environ.get("NEO4J_USER", "neo4j"),
    password=os.environ.get(
        "NEO4J_PASS", "compensation-drainers-tracks")
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

openai_embedding = OpenAIEmbedding(openai_api_key=openai_api_key)

vector_search = VectorSearch(
    database=neo4j_connection, label="Movie", property="embedding", k=3)

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


@ app.get("/text2vector")
async def root(question: str):
    """
    Takes an input and embeds it with OpenAI model, then performs a vector search
    """
    if not question:
        return "missing question"
    try:
        embedding = openai_embedding.generate(question)
        return vector_search.run(embedding)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
