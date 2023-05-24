import { model } from "@neo4j/graph-schema-utils";

/**
 *  This function is used to convert the property graph data model to the schema used for the unstructured import model.
 * @param graphSchemaString - The property graph data model as a json string
 */
export const graphSchemaToModelSchema = (graphSchemaString: string) => {
  const parsed = model.GraphSchemaRepresentation.parseJson(graphSchemaString);

  const nodes = parsed.graphSchema.nodeLabels.map((nodeLabel) => {
    const propertyObjects = parsed.graphSchema.nodeObjectTypes.filter(
      (objectType) =>
        objectType.labels.some((label) => label.token === nodeLabel.token)
    );

    const properties = propertyObjects.map((propertyObject) => {
      const propertiesStrings = graphSchemaPropertiesToModelProperties(
        propertyObject.properties
      );

      return `${propertiesStrings.join(", ")}`;
    });

    if (properties.length === 0) {
      return `[${nodeLabel.token}]`;
    }
    return `[${nodeLabel.token} {${properties.join(", ")}}]`;
  });
  const nodeString = `[${nodes.join(", ")}]`;

  const relationships = parsed.graphSchema.relationshipObjectTypes.map(
    (relationshipObjectTypes) => {
      const propertyStrings = graphSchemaPropertiesToModelProperties(
        relationshipObjectTypes.properties
      );
      const from = relationshipObjectTypes.from.labels[0].token;
      const to = relationshipObjectTypes.to.labels[0].token;

      if (propertyStrings.length > 0) {
        return `[${from}, ${
          relationshipObjectTypes.type.token
        }, ${to} {${propertyStrings.join(", ")}}]`;
      }
      return `[${from}, ${relationshipObjectTypes.type.token}, ${to}]`;
    }
  );
  const relationshipString = `[${relationships.join(", ")}]`;

  return `Nodes: ${nodeString} Relationships: ${relationshipString}`;
};

const graphSchemaPropertiesToModelProperties = (
  properties: model.Property[]
) => {
  const propertiesStrings = properties.map((property) => {
    const type = property.type;
    if (type instanceof Array) {
      return `${property.token}: [${type.map((t) => t.type).join(", ")}]`;
    }
    return `${property.token}: ${type.type}`;
  });
  return propertiesStrings;
};
