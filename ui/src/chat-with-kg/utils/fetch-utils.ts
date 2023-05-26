type JSONResponse = {
  output?: string,
  generated_cypher?: string | null,
  detail?: any
};

export const fetchQuestionAnswer = async (question: string) => {
  console.log("sending question", question);
  const response = await fetch(
    `${import.meta.env.VITE_KG_CHAT_BACKEND_ENDPOINT}/text2text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );
  if (!response.ok) {
    return Promise.reject(
      new Error(`Failed to answer question: ${response.statusText}`)
    );
  }

  const { output, detail }: JSONResponse = await response.json();
  if (detail !== undefined || !output) {
    const error = new Error("An unkown error occurred");
    return Promise.reject(error);
  }
  console.log("output", output);
  return output;
};
