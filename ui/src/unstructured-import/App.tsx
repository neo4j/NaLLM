import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import { useState } from "react";
import { runImport } from "./utils/fetch-utils";
import { Switch } from "../components/switch";
import ReactMarkdown from "react-markdown";
import { graphSchemaToModelSchema } from "./utils/graph-schema-utils";

function App() {
  const [useSchema, setUseSchema] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [schema, setSchema] = useState<string>("");

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    const file = document.querySelector(".file-input") as HTMLInputElement;
    const reader = new FileReader();
    reader.onload = async () => {
      console.log(reader.result);
      try {
        console.log("running import");
        console.log("raw schema", schema);
        const schemaJson = useSchema
          ? graphSchemaToModelSchema(schema)
          : undefined;
        console.log("schema json", schemaJson);
        const importResult = await runImport(
          reader.result as string,
          schemaJson
        );
        console.log("import result", importResult);
        if (importResult) {
          console.log(importResult);
          setResult(importResult);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    const text = reader.readAsText(file.files![0]);
  };

  return (
    <div className="min-h-screen n-bg-palette-neutral-bg-default">
      <main className="flex flex-col gap-10 p-2">
        <div className="flex flex-col w-2/3 min-h-0 gap-2 mx-auto mt-10">
          <h1 className="text-4xl font-bold text-center">Import data</h1>
          <p>
            This tool is used to import unstructured data into Neo4j. It takes a
            file as input and optionally a schema in the form of{" "}
            <a href="https://neo4j.com/developer-blog/describing-property-graph-data-model/">
              graph data model
            </a>{" "}
            which is used to limit the data that is extracted from the file.
            It's important to give the schema descriptive tokens so the tool can
            identify the data that is imported.
          </p>

          <Switch
            label="Use schema"
            checked={useSchema}
            onChange={() => setUseSchema(!useSchema)}
          />
          {useSchema ? (
            <div className="flex flex-col gap-4">
              Please provide your schema in json format:
              <textarea
                className="px-3 border rounded-sm body-medium border-palette-neutral-border-strong bg-palette-neutral-bg-weak"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
              />
            </div>
          ) : null}

          <input type="file" className={`w-full max-w-xs file-input`} />
          <button
            className={`ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong ${
              loading ? "ndl-loading" : ""
            }`}
            onClick={handleImport}
          >
            {loading ? "Importing. This will take a while..." : "Import"}
          </button>
        </div>

        <div>
          {result ? (
            <div className="flex flex-col w-2/3 gap-2 mx-auto">
              <h1 className="text-4xl font-bold text-center">Result</h1>
              <p>
                The import was successful. The following nodes and relationships
                were created:
              </p>
              <div className="overflow-auto">
                <ReactMarkdown className="overflow-auto">
                  {result}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
