import sys
import os
from pathlib import Path

current_file = Path(__file__).resolve()
project_root = current_file.parents[4]
sys.path.append(str(project_root))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from use_cases.shared.embedding.openai import OpenAIEmbedding
from use_cases.shared.components.vector_search import VectorSearch
from use_cases.shared.components.text2cypher import Text2Cypher
from use_cases.shared.components.summarize_cypher_result import SummarizeCypherResult
from use_cases.shared.driver.neo4j import Neo4jDatabase
from use_cases.shared.llm.openai import OpenAIChat
from pydantic import BaseModel


class Payload(BaseModel):
    question: str


cypher = {}
cypher['arxiv'] = """
CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE;
LOAD CSV WITH HEADERS FROM "https://raw.githubusercontent.com/tomasonjo/blog-datasets/main/arxiv/arxiv.csv" AS row
MERGE (p:Paper {id: row.paper_id})
SET p += apoc.map.clean(row, ["paper_id", "authors"], [])
WITH p, row.authors AS authors
UNWIND apoc.convert.fromJsonList(authors) as author
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
                          cypher_examples="")

summarize_results = SummarizeCypherResult(llm=llm)

openai_embedding = OpenAIEmbedding(openai_api_key=openai_api_key)

vector_search = VectorSearch(
    database=neo4j_connection, label="Paper", property="embedding", k=3)

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@ app.get("/text2cypher")
async def root(question: str):
    """
    Takes an input and returns results from the database
    """
    try:
        return text2cypher.run(question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.post("/text2cypher")
async def root(payload: Payload):
    """
    Takes an input and returns results from the database
    """
    if not payload:
        return {"detail": "missing request body"}
    try:
        return text2cypher.run(payload.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.get("/text2text")
async def root(payload: Payload):
    """
    Takes an input and returns natural language generate response
    """
    if not payload:
        return {"detail": "missing request body"}
    try:
        results = text2cypher.run(payload.question)
        return {"output": summarize_results.run(payload.question, results['output']), "generated_cypher": results['generated_cypher']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.post("/text2text")
async def root(payload: Payload):
    """
    Takes an input and returns natural language generate response
    """
    if not payload:
        return {"detail": "missing request body"}
    try:
        results = text2cypher.run(payload.question)
        return {"output": summarize_results.run(payload.question, results['output']), "generated_cypher": results['generated_cypher']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.get("/text2vector")
async def root(question: str):
    """
    Takes an input and embeds it with OpenAI model, then performs a vector search
    """
    try:
        embedding = openai_embedding.generate(question)
        return vector_search.run(embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.post("/text2vector")
async def root(question: str):
    """
    Takes an input and embeds it with OpenAI model, then performs a vector search
    """
    try:
        embedding = openai_embedding.generate(question)
        return vector_search.run(embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.get("/load")
async def root(dataset: str):
    """
    Constructs appropriate indexes and import relevant dataset into Neo4j
    """
    try:
        queries = cypher[dataset].split(";")
        for q in queries:
            if q:
                neo4j_connection.query(q)
        neo4j_connection.refresh_schema()
        return {"message": "import successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@ app.get("/init")
async def root():
    """
    Checks if the database is empty
    """
    try:
        return {"message": neo4j_connection.check_if_empty()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
