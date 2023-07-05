import React from "react";
import { createRoot } from "react-dom/client";

import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <div className="flex flex-col min-h-screen gap-4 max-w-[1000px] w-[80%] mx-auto mt-4 ">
      <h1 className="text-4xl font-bold text-center">NaLLM Demo</h1>
      <p>
        Welcome to the NaLLM project demo, In this project we have explored two
        use cases. A Natural Language Interface to a Knowledge Graph and
        Creating a Knowledge Graph from Unstructured Data.
      </p>
      <p>Use the options below to explore the use cases.</p>
      <div className="flex flex-col w-full gap-4 px-10">
        <a
          href="use-cases/chat-with-kg/index.html"
          className="ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong"
        >
          Chat With KG
        </a>
        <a
          href="use-cases/unstructured-import/index.html"
          className="ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong"
        >
          Unstructured Import
        </a>
        <a
          href="use-cases/report-generation/index.html"
          className="ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong"
        >
          Report generator
        </a>
      </div>
    </div>
  </React.StrictMode>
);
