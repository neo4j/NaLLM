from fastapi import FastAPI
import sys
import os
from pathlib import Path

current_file = Path(__file__).resolve()
project_root = current_file.parents[4]
sys.path.append(str(project_root))

from use_cases.shared.llm.openai import OpenAIChat
from use_cases.shared.driver.neo4j import Neo4jDatabase
from use_cases.shared.components.summarize_cypher_result import SummarizeCypherResult
from use_cases.shared.components.text2cypher import Text2Cypher
from use_cases.shared.components.vector_search import VectorSearch
from use_cases.shared.embedding.openai import OpenAIEmbedding

cypher = {}
cypher['arxiv'] = """
CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE;
LOAD CSV WITH HEADERS FROM "https://raw.githubusercontent.com/tomasonjo/blog-datasets/main/arxiv/arxiv.csv" AS row
MERGE (p:Paper {id: row.paper_id})
SET p += apoc.map.clean(row, ["paper_id", "authors"], [])
WITH p, row.authors AS authors
UNWIND authors as author
MERGE (a:Author {name:author})
MERGE (p)-[:HAS_AUTHOR]->(a);
LOAD CSV WITH HEADERS FROM "https://raw.githubusercontent.com/tomasonjo/blog-datasets/main/arxiv/arxiv_embedding.csv" AS row
MATCH (p:Paper {id: row.paper_id})
SET p.embedding = row.embedding;"""


neo4j_connection = Neo4jDatabase(
    host=os.environ.get("NEO4J_URL", "bolt://neo4j:7687"),
    user=os.environ.get("NEO4J_USER", "neo4j"),
    password=os.environ.get(
        "NEO4J_PASS", "pleaseletmein")
)

openai_api_key = os.environ.get(
    "OPENAI_API_KEY", "")

llm = OpenAIChat(openai_api_key=openai_api_key, model_name="gpt-3.5-turbo")

text2cypher = Text2Cypher(database=neo4j_connection,
                          llm=llm,
                          schema=True,
                          cypher_examples="""
                          """)

summarize_results = SummarizeCypherResult(llm=llm)

openai_embedding = OpenAIEmbedding(openai_api_key=openai_api_key)

vector_search = VectorSearch(
    database=neo4j_connection, label="Paper", property="embedding", k=3)

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


@ app.get("/load")
async def root(dataset: str):
    """
    Constructs appropriate indexes and import relevant dataset into Neo4j
    """
    if not dataset:
        return {"message": "missing dataset"}
    try:
        queries = cypher[dataset].split(";")
        for q in queries:
            if q:
                neo4j_connection.query(q)
        neo4j_connection.refresh_schema()
        return {"message": "import successful"}
    except Exception as e:
        return {"message": f"Error: {e}"}


@ app.get("/init")
async def root():
    """
    Checks if the database is empty
    """
    try:
        data = neo4j_connection.query("""
        MATCH (n)
        WITH count(n) as c
        RETURN CASE WHEN c > 0 THEN true ELSE false END AS output
        """)
        return {"message": data[0]["output"]}
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
