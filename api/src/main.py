import os
from typing import Optional
from components.company_report import CompanyReport

from components.data_disambiguation import DataDisambiguation
from components.question_proposal_generator import (
    QuestionProposalGenerator,
)
from components.summarize_cypher_result import SummarizeCypherResult
from components.text2cypher import Text2Cypher
from components.unstructured_data_extractor import (
    DataExtractor,
    DataExtractorWithSchema,
)
from driver.neo4j import Neo4jDatabase
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fewshot_examples import get_fewshot_examples
from llm.openai import OpenAIChat
from pydantic import BaseModel


class Payload(BaseModel):
    question: str
    api_key: Optional[str]
    model_name: Optional[str]


class ImportPayload(BaseModel):
    input: str
    neo4j_schema: Optional[str]
    api_key: Optional[str]


class questionProposalPayload(BaseModel):
    api_key: Optional[str]


# Maximum number of records used in the context
HARD_LIMIT_CONTEXT_RECORDS = 10

neo4j_connection = Neo4jDatabase(
    host=os.environ.get("NEO4J_URL", "neo4j+s://demo.neo4jlabs.com"),
    user=os.environ.get("NEO4J_USER", "companies"),
    password=os.environ.get("NEO4J_PASS", "companies"),
    database=os.environ.get("NEO4J_DATABASE", "companies"),
)


# Initialize LLM modules
openai_api_key = os.environ.get("OPENAI_API_KEY", None)


# Define FastAPI endpoint
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


@app.post("/questionProposalsForCurrentDb")
async def questionProposalsForCurrentDb(payload: questionProposalPayload):
    if not openai_api_key and not payload.api_key:
        raise HTTPException(
            status_code=422,
            detail="Please set OPENAI_API_KEY environment variable or send it as api_key in the request body",
        )
    api_key = openai_api_key if openai_api_key else payload.api_key

    questionProposalGenerator = QuestionProposalGenerator(
        database=neo4j_connection,
        llm=OpenAIChat(
            openai_api_key=api_key,
            model_name="gpt-3.5-turbo-0613",
            max_tokens=512,
            temperature=0.8,
        ),
    )

    return questionProposalGenerator.run()


@app.get("/hasapikey")
async def hasApiKey():
    return JSONResponse(content={"output": openai_api_key is not None})


@app.websocket("/text2text")
async def websocket_endpoint(websocket: WebSocket):
    async def sendDebugMessage(message):
        await websocket.send_json({"type": "debug", "detail": message})

    async def sendErrorMessage(message):
        await websocket.send_json({"type": "error", "detail": message})

    async def onToken(token):
        delta = token["choices"][0]["delta"]
        if "content" not in delta:
            return
        content = delta["content"]
        if token["choices"][0]["finish_reason"] == "stop":
            await websocket.send_json({"type": "end", "output": content})
        else:
            await websocket.send_json({"type": "stream", "output": content})

        # await websocket.send_json({"token": token})

    await websocket.accept()
    await sendDebugMessage("connected")
    chatHistory = []
    try:
        while True:
            data = await websocket.receive_json()
            if not openai_api_key and not data.get("api_key"):
                raise HTTPException(
                    status_code=422,
                    detail="Please set OPENAI_API_KEY environment variable or send it as api_key in the request body",
                )
            api_key = openai_api_key if openai_api_key else data.get("api_key")

            default_llm = OpenAIChat(
                openai_api_key=api_key,
                model_name=data.get("model_name", "gpt-3.5-turbo-0613"),
            )
            summarize_results = SummarizeCypherResult(
                llm=OpenAIChat(
                    openai_api_key=api_key,
                    model_name="gpt-3.5-turbo-0613",
                    max_tokens=128,
                )
            )

            text2cypher = Text2Cypher(
                database=neo4j_connection,
                llm=default_llm,
                cypher_examples=get_fewshot_examples(api_key),
            )

            if "type" not in data:
                await websocket.send_json({"error": "missing type"})
                continue
            if data["type"] == "question":
                try:
                    question = data["question"]
                    chatHistory.append({"role": "user", "content": question})
                    await sendDebugMessage("received question: " + question)
                    results = None
                    try:
                        results = text2cypher.run(question, chatHistory)
                        print("results", results)
                    except Exception as e:
                        await sendErrorMessage(str(e))
                        continue
                    if results == None:
                        await sendErrorMessage("Could not generate Cypher statement")
                        continue

                    await websocket.send_json(
                        {
                            "type": "start",
                        }
                    )
                    output = await summarize_results.run_async(
                        question,
                        results["output"][:HARD_LIMIT_CONTEXT_RECORDS],
                        callback=onToken,
                    )
                    chatHistory.append({"role": "system", "content": output})
                    await websocket.send_json(
                        {
                            "type": "end",
                            "output": output,
                            "generated_cypher": results["generated_cypher"],
                        }
                    )
                except Exception as e:
                    await sendErrorMessage(str(e))
                await sendDebugMessage("output done")
    except WebSocketDisconnect:
        print("disconnected")


@app.post("/data2cypher")
async def root(payload: ImportPayload):
    """
    Takes an input and created a Cypher query
    """
    if not openai_api_key and not payload.api_key:
        raise HTTPException(
            status_code=422,
            detail="Please set OPENAI_API_KEY environment variable or send it as api_key in the request body",
        )
    api_key = openai_api_key if openai_api_key else payload.api_key

    try:
        result = ""

        llm = OpenAIChat(
            openai_api_key=api_key, model_name="gpt-3.5-turbo-16k", max_tokens=4000
        )

        if not payload.neo4j_schema:
            extractor = DataExtractor(llm=llm)
            result = extractor.run(data=payload.input)
        else:
            extractor = DataExtractorWithSchema(llm=llm)
            result = extractor.run(schema=payload.neo4j_schema, data=payload.input)

        print("Extracted result: " + str(result))

        disambiguation = DataDisambiguation(llm=llm)
        disambiguation_result = disambiguation.run(result)

        print("Disambiguation result " + str(disambiguation_result))

        return {"data": disambiguation_result}

    except Exception as e:
        print(e)
        return f"Error: {e}"


class companyReportPayload(BaseModel):
    company: str
    api_key: Optional[str]


# This endpoint is database specific and only works with the Demo database.
@app.post("/companyReport")
async def companyInformation(payload: companyReportPayload):
    api_key = openai_api_key if openai_api_key else payload.api_key
    if not openai_api_key and not payload.api_key:
        raise HTTPException(
            status_code=422,
            detail="Please set OPENAI_API_KEY environment variable or send it as api_key in the request body",
        )
    api_key = openai_api_key if openai_api_key else payload.api_key

    llm = OpenAIChat(
        openai_api_key=api_key,
        model_name="gpt-3.5-turbo-16k-0613",
        max_tokens=512,
    )
    print("Running company report for " + payload.company)
    company_report = CompanyReport(neo4j_connection, payload.company, llm)
    result = company_report.run()

    return JSONResponse(content={"output": result})


@app.post("/companyReport/list")
async def companyReportList():
    company_data = neo4j_connection.query(
        "MATCH (n:Organization) WITH n WHERE rand() < 0.01 return n.name LIMIT 5",
    )

    return JSONResponse(content={"output": [x["n.name"] for x in company_data]})


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ready")
async def readiness_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, port=int(os.environ.get("PORT", 7860)), host="0.0.0.0")
