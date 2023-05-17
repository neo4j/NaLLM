# Import unstructured data

This use-case is designed to allow you to extract information from unstructured data to be stored in a Neo4j database.

THe use-case currently does not support importing the data into Neo4j, instead it creates several csv files that can be imported into Neo4j.

## Setup

- Create `.env` file
- Populate OpenAI credentials in the `.env` as shown in the `.env.example`
- Start the project by running `docker-compose up`
- Open your favorite internet browser at TBD

## Data

The import process is designed to work with any data in text format. The data is expected to be in a single file but can be split into multiple files.
