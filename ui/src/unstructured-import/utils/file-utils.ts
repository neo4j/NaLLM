import JSZip from "jszip";
import FileSaver, { saveAs } from "file-saver";
import {
  ImportResult,
  NodeType,
  RelationshipType,
} from "../types/respons-types";
import { dataToCypher } from "./cypher-utils";
import { model } from "@neo4j/graph-schema-utils";
import { nanoid } from "nanoid";

const regex = /```([\w\W]*?)\n([\w\W]*?)```/g;

export const saveCypherResult = (importResult: ImportResult) => {
  const fileName = "neo4j_unstructured_import.cypher";
  const cypher = dataToCypher(importResult);
  const cypherBlob = new Blob([cypher], { type: "text/plain;charset=utf-8" });
  FileSaver.saveAs(cypherBlob, fileName);
};

const nodesToCsv = (nodes: NodeType[]) => {
  const properties = [
    ...new Set(...nodes.map((item) => Object.keys(item.properties))),
  ];
  const header = ["id", "label", ...properties].join(",");
  const body = nodes
    .map((item) => {
      const values = [item.name, item.label];
      properties.forEach((property) => {
        values.push(item.properties[property] || "");
      });

      return values.join(",");
    })
    .join("\n");

  return `${header}\n${body}`;
};

const relationshipsToCsv = (relationships: RelationshipType[]) => {
  const properties = [
    ...new Set(...relationships.map((item) => Object.keys(item.properties))),
  ];
  const header = ["type", "start", "end", ...properties].join(",");
  const body = relationships
    .map((item) => {
      const values = [item.type, item.start, item.end];
      properties.forEach((property) => {
        values.push(item.properties[property] || "");
      });
      return values.join(",");
    })
    .join("\n");

  console.log(`${header}\n${body}`);
  return `${header}\n${body}`;
};

export const saveImportResultAsNeo4jImport = (importResult: ImportResult) => {
  const labels = [...new Set(importResult.nodes.map((item) => item.label))];
  const relationships = [
    ...new Set(importResult.relationships.map((item) => item.type)),
  ];
  const zip = new JSZip();
  const modelFile = {
    version: "0.13.0-beta.0",
    graph: {
      nodes: [] as any[],
      relationships: [] as any[],
    },
    dataModel: {
      fileModel: {
        fileSchemas: {} as any,
      },
      graphModel: {
        nodeSchemas: {} as any,
        relationshipSchemas: {} as any,
      },
      mappingModel: {
        nodeMappings: {} as any,
        relationshipMappings: {} as any,
      },
      configurations: {
        idsToIgnore: [],
      },
    },
  };

  const nodeObjectTypes: model.NodeObjectType[] = [];
  const nodeLabels: model.NodeLabel[] = [];
  const relationshipTypes: model.RelationshipType[] = [];
  relationships.map(
    (relationship, index) =>
      new model.RelationshipType(`n${index}`, relationship)
  ),
    labels.forEach((label, index) => {
      const nodeLabel = new model.NodeLabel(`n${index}`, label);

      const nodes = importResult.nodes.filter((item) => item.label === label);

      modelFile.graph.nodes.push({
        id: `n${index}`,
        position: {
          x: index * 10,
          y: index * 10,
        },
        caption: label,
      });

      nodeObjectTypes.push(new model.NodeObjectType(`n${index}`, [nodeLabel]));
      const nodesCsv = nodesToCsv(nodes);
      zip.file(`nodes-${label}.csv`, nodesCsv);

      const fields = [
        ...Object.keys(nodes[0].properties).map((key) => {
          return {
            name: key,
            type: "string",
            sample: nodes[0].properties[key],
            include: true,
          };
        }),
        {
          name: "id",
          type: "string",
          sample: nodes[0].name,
          include: true,
        },
      ];

      const idIdentifier = nanoid();
      modelFile.dataModel.graphModel.nodeSchemas[`n${index}`] = {
        label: label,
        additionLabels: [],
        labelProperties: [],
        properties: [
          {
            property: "id",
            type: "string",
            identifier: idIdentifier,
          },
          ...Object.keys(nodes[0].properties).map((key) => {
            return {
              property: key,
              type: "string",
              identifier: nanoid(),
            };
          }),
        ],
        key: {
          properties: [idIdentifier],
        },
      };

      modelFile.dataModel.mappingModel.nodeMappings[`n${index}`] = {
        fileSchema: `nodes-${label}.csv`,
        nodeSchema: `n${index}`,
        mappings: [
          {
            field: "id",
          },
          ...Object.keys(nodes[0].properties).map((key) => {
            return {
              field: key,
            };
          }),
        ],
      };

      modelFile.dataModel.fileModel.fileSchemas[`nodes-${label}.csv`] = {
        expanded: true,
        fields: fields,
      };
    });

  relationships.forEach((relationship, index) => {
    const relationships = importResult.relationships.filter(
      (item) => item.type === relationship
    );
    relationshipTypes.push(
      new model.RelationshipType(`r${relationship}`, relationship)
    );

    const startLabel =
      importResult.nodes.find((item) => item.name === relationships[0].start)
        ?.label ?? "-1";
    const endLabel =
      importResult.nodes.find((item) => item.name === relationships[0].end)
        ?.label ?? "-1";

    const relationshipsCsv = relationshipsToCsv(relationships);
    console.log(relationships[0].start);

    const fromId = labels.indexOf(startLabel);
    const toId = labels.indexOf(endLabel);

    if (fromId === -1 || toId === -1) {
      return;
    }

    modelFile.graph.relationships.push({
      id: `n${index}`,
      type: relationship,
      fromId: `n${fromId}`,
      toId: `n${toId}`,
    });

    zip.file(`relationships-${relationship}.csv`, relationshipsCsv);

    const fields = [
      ...Object.keys(relationships[0].properties).map((key) => {
        return {
          name: key,
          type: "string",
          sample: relationships[0].properties[key],
          include: true,
        };
      }),
      {
        name: "type",
        type: "string",
        sample: relationships[0].type,
        include: true,
      },
      {
        name: "start",
        type: "string",
        sample: relationships[0].start,
        include: true,
      },
      {
        name: "end",
        type: "string",
        sample: relationships[0].end,
        include: true,
      },
    ];

    modelFile.dataModel.fileModel.fileSchemas[
      `relationships-${relationship}.csv`
    ] = {
      expanded: true,
      fields: fields,
    };

    modelFile.dataModel.graphModel.relationshipSchemas[`n${index}`] = {
      type: relationship,
      sourceNodeSchema: `n${labels.indexOf(startLabel)}`,
      targetNodeSchema: `n${labels.indexOf(endLabel)}`,
      properties: [
        ...Object.keys(relationships[0].properties).map((key) => {
          return {
            property: key,
            type: "string",
            identifier: nanoid(),
          };
        }),
      ],
    };

    modelFile.dataModel.mappingModel.relationshipMappings[`n${index}`] = {
      fileSchema: `relationships-${relationship}.csv`,
      relationshipSchema: `n${index}`,
      mappings: [
        {
          field: "type",
        },
      ],
      sourceMappings: [
        {
          field: "start",
        },
      ],
      targetMappings: [
        {
          field: "end",
        },
      ],
    };
  });

  /*const graphSchema = new model.GraphSchema(
    nodeLabels,
    relationshipTypes,
    [],
    []
  );
  //const myModel = new model.GraphSchemaRepresentation("1.0.0", graphSchema);
  //modelFile.dataModel.graphModel = myModel;*/

  zip.file("neo4j_importer_model.json", JSON.stringify(modelFile));

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "import.zip");
  });
};
