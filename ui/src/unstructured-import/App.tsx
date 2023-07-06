import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import { useState, useEffect } from "react";
import { runImport } from "./utils/fetch-utils";
import { Switch } from "../components/switch";
import { graphSchemaToModelSchema } from "./utils/graph-schema-utils";
import KeyModal from "../components/keymodal";
import { ImportResult } from "./types/respons-types";
import {
  saveCypherResult,
  saveImportResultAsNeo4jImport,
} from "./utils/file-utils";

const HAS_API_KEY_URI =
  import.meta.env.VITE_HAS_API_KEY_ENDPOINT ??
  "http://localhost:7860/hasapikey";

function loadKeyFromStorage() {
  return localStorage.getItem("api_key");
}

function App() {
  const [serverAvailable, setServerAvailable] = useState(true);
  const [needsApiKeyLoading, setNeedsApiKeyLoading] = useState(true);
  const [needsApiKey, setNeedsApiKey] = useState(true);
  const [useSchema, setUseSchema] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [schema, setSchema] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(loadKeyFromStorage() || "");

  const initDone = serverAvailable && !needsApiKeyLoading;

  useEffect(() => {
    fetch(HAS_API_KEY_URI).then(
      (response) => {
        response.json().then(
          (result) => {
            // const needsKey = result.output;
            const needsKey = !result.output;
            setNeedsApiKey(needsKey);
            setNeedsApiKeyLoading(false);
            if (needsKey) {
              const api_key = loadKeyFromStorage();
              if (api_key) {
                setApiKey(api_key);
              } else {
                setModalIsOpen(true);
              }
            }
          },
          (error) => {
            setNeedsApiKeyLoading(false);
            setServerAvailable(false);
          }
        );
      },
      (error) => {
        setNeedsApiKeyLoading(false);
        setServerAvailable(false);
      }
    );
  }, []);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const onCloseModal = () => {
    setModalIsOpen(false);
  };

  const onApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem("api_key", newApiKey);
  };

  const handleImport = async () => {
    if (!serverAvailable || needsApiKeyLoading) {
      return;
    }
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
          schemaJson,
          needsApiKey ? apiKey : undefined
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

  if (serverAvailable) {
    return (
      <div className="min-h-screen n-bg-palette-neutral-bg-default">
        {needsApiKey && (
          <div className="flex justify-end mr-4">
            <button onClick={openModal}>API Key</button>
          </div>
        )}
        <KeyModal
          isOpen={initDone && needsApiKey && modalIsOpen}
          onCloseModal={onCloseModal}
          onApiKeyChanged={onApiKeyChange}
          apiKey={apiKey}
        />
        <main className="flex flex-col gap-10 p-2">
          <div className="flex flex-col w-2/3 max-w-2xl min-h-0 gap-2 mx-auto mt-10">
            <h1 className="text-4xl font-bold text-center">Import data</h1>
            <p>
              This tool is used to import unstructured data into Neo4j. It takes
              a file as input and optionally a schema in the form of{" "}
              <a href="https://neo4j.com/developer-blog/describing-property-graph-data-model/">
                graph data model
              </a>{" "}
              which is used to limit the data that is extracted from the file.
              It's important to give the schema descriptive tokens so the tool
              can identify the data that is imported.
            </p>

            <p>
              The tool will try to extract as much data as possible from the
              file and give you two options to import the data into Neo4j:
            </p>

            <ul>
              <li>A cypher script that you can run in Neo4j Browser</li>
              <li>A file that you can import using the Neo4j Import Tool</li>
            </ul>

            <p>
              {" "}
              If you use the Neo4j file you need to open Neo4j Importer which
              can be found in the Neo4j Desktop. Select the options Open model
              (with data){" "}
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
              disabled={!initDone}
            >
              {loading ? "Importing. This will take a while..." : "Import"}
            </button>
          </div>

          <div>
            {result ? (
              <div className="flex flex-col w-2/3 gap-2 mx-auto">
                <h1 className="text-4xl font-bold text-center">Result</h1>
                <p>
                  The import was successful. You can save the result as a
                  cypher.
                </p>
                <button
                  className="ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong"
                  onClick={() => saveCypherResult(result)}
                >
                  Save as Cypher
                </button>
                <button
                  className="ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong"
                  onClick={() => saveImportResultAsNeo4jImport(result)}
                >
                  Save as Neo4j Import format
                </button>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen n-bg-palette-neutral-bg-default">
        <main className="flex flex-col gap-10 p-2">
          <div className="flex flex-col w-2/3 min-h-0 gap-2 mx-auto mt-10">
            <p></p>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
