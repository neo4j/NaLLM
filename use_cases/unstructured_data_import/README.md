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

## API

The API is designed to be used with the following endpoints:

### /data2cypher/

Takes a POST request with a JSON body containing the following fields:

- `data`: The data to be imported
- `neo4j_schema`: (optional) The graph schema the data to be extracted should follow. Should use the form `Nodes: [ENTITY_TYPE {property_name: property_type}, ...], ... Relationships [ENTITY_START_TYPE, RELATIONSHIP_TYPE, ENTITY_END_TYPE ]`. For example:
  `Nodes: [Pokemon {name: string, type: string}] Relationships: [Pokemon, EVOLVES_INTO, Pokemon, {level: integer}]`. If the field is left empty the schema will be inferred from the data.
