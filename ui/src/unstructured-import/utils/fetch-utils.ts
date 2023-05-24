type JSONResponse = {
  data?: string;
  errors?: Array<{ message: string }>;
};

export const runImport = async (input: string, schema?: string) => {
  console.log("sending body", JSON.stringify({ input, neo4j_schema: schema }));
  const response = await fetch(
    `${import.meta.env.VITE_UNSTRUCTUED_IMPORT_BACKEND_ENDPOINT}/data2cypher`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, neo4j_schema: schema ? schema : "" }),
    }
  );
  if (!response.ok) {
    return Promise.reject(
      new Error(`Failed to import: ${response.statusText}`)
    );
  }

  const { data, errors }: JSONResponse = await response.json();
  if (errors !== undefined) {
    const error = new Error(
      errors?.map((e) => e.message).join("\n") ?? "unknown"
    );
    return Promise.reject(error);
  }
  console.log("data", data);
  return data ?? "";
};
