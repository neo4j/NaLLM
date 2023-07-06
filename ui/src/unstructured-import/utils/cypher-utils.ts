import { NodeType, RelationshipType } from "../types/respons-types";

function createNodeStatement(node: NodeType) {
  const properties = Object.entries(node.properties);
  const propertiesStrings: string[] = [];
  propertiesStrings.push(
    `import_name: '${node.name.toString().replaceAll("'", "\\'")}'`
  );

  properties.forEach((property) => {
    const propertyKey = property[0];
    const propertyValue = property[1];
    if (propertyKey === undefined || propertyValue === undefined) {
      return;
    }
    console.log(propertyKey, propertyValue);
    propertiesStrings.push(
      `\`${propertyKey}\`: '${propertyValue.toString().replaceAll("'", "\\'")}'`
    );
  });
  return `CREATE (:\`${node.label}\` {${propertiesStrings.join(", ")}  })`;
}

// Function to generate a Cypher statement for creating a relationship
function createRelationshipStatement(relationship: RelationshipType) {
  const properties = Object.entries(relationship.properties);
  const propertiesStrings: string[] = [];
  properties.forEach((property) => {
    const propertyKey = property[0];
    const propertyValue = property[1];
    if (propertyKey === undefined || propertyValue === undefined) {
      return;
    }

    propertiesStrings.push(
      `\`${propertyKey}\`: '${propertyValue.toString().replaceAll("'", "\\'")}'`
    );
  });
  //TODO: Make into single statement
  return `MATCH (source { import_name: '${relationship.start
    .toString()
    .replaceAll("'", "\\'")}' }), (target { import_name: '${relationship.end
    .toString()
    .replaceAll("'", "\\'")}' }) CREATE (source)-[:\`${relationship.type
    .toString()
    .replaceAll("'", "\\'")}\` {${propertiesStrings.join(", ")}}]->(target);`;
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
