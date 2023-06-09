import { NodeType, RelationshipType } from "../types/respons-types";

function createNodeStatement(node: NodeType) {
  const properties = Object.entries(node.properties);
  const propertiesStrings: string[] = [];
  propertiesStrings.push(`import_name: '${node.name}'`);

  properties.forEach((property) => {
    propertiesStrings.push(`${property[0]}: '${property[1]}'`);
  });
  return `CREATE (:\`${node.label}\` {${propertiesStrings.join(", ")}  })`;
}

// Function to generate a Cypher statement for creating a relationship
function createRelationshipStatement(relationship: RelationshipType) {
  const properties = Object.entries(relationship.properties);
  const propertiesStrings: string[] = [];
  properties.forEach((property) => {
    propertiesStrings.push(`${property[0]}: '${property[1]}'`);
  });
  //TODO: Make into single statement
  return `MATCH (source { import_name: '${
    relationship.start
  }' }), (target { import_name: '${relationship.end}' }) CREATE (source)-[:\`${
    relationship.type
  }\` {${propertiesStrings.join(", ")}}]->(target);`;
}

export const dataToCypher = (data: {
  nodes: NodeType[];
  relationships: RelationshipType[];
}) => {
  const cypherStatements: string[] = [];

  data.nodes.forEach((node, index) => {
    let nodeStatement = createNodeStatement(node);
    if (index === data.nodes.length - 1) {
      nodeStatement += ";";
    }
    cypherStatements.push(nodeStatement);
  });

  data.relationships.forEach((relationship) => {
    cypherStatements.push(createRelationshipStatement(relationship));
  });

  const cypherScript = cypherStatements.join("\n");
  return cypherScript;
};
