# Chat with knowledge graph

This use-case is designed to allow you to retrieve information from any Neo4j database using natural language.
You can use any your Neo4j databases, or you can create a Neo4j Sandbox project to test out this use case.
If you are not using a Sandbox instance, make sure you have APOC and GDS libraries installed.

## Setup

* Create `.env` file
* Populate Neo4j and OpenAI credentials in the `.env` as shown in the `.env.example`
* Start the project by running `docker-compose up`
* Open your favorite internet browser at TBD

## Dataset

When you first run the project, the Neo4j database is empty.
You can check if the database is empty by sending a GET request to:

```
http://localhost:7860/init
```

The API interface has a `load` endpoint that allows you to populate the database.
You can import a small ArXiv dataset by sending a GET request to:

```
http://localhost:7860/load?dataset=arxiv
```