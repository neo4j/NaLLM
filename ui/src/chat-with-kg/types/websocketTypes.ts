export type WebSocketRequest = {
  type: "question";
  question: string;
  api_key?: string;
  model_name?: string;
};

export type WebSocketResponse =
  | { type: "start" }
  | {
      type: "stream";
      output: string;
    }
  | {
      type: "end";
      output: string;
      generated_cypher: string | null;
    }
  | {
      type: "error";
      detail: string;
    }
  | {
      type: "debug";
      detail: string;
    };

export type ConversationState = "waiting" | "streaming" | "ready" | "error";
