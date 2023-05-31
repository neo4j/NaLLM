import { useCallback, useEffect, useState } from "react";
import ChatContainer from "./ChatContainer";
import type { ChatMessageObject } from "./ChatMessage";
import ChatInput from "./ChatInput";
import useWebSocket, { ReadyState } from "react-use-websocket";
import type {
  ConversationState,
  WebSocketRequest,
  WebSocketResponse,
} from "./types/websocketTypes";

const SEND_REQUESTS = true;

const chatMessageObjects: ChatMessageObject[] = SEND_REQUESTS
  ? []
  : [
      {
        id: 0,
        type: "input",
        sender: "self",
        message:
          "This is the first message which has decently long text and would denote something typed by the user",
        complete: true,
      },
      {
        id: 1,
        type: "text",
        sender: "bot",
        message:
          "And here is another message which would denote a response from the server, which for now will only be text",
        complete: true,
      },
    ];

const URI =
  import.meta.env.VITE_KG_CHAT_BACKEND_ENDPOINT ??
  "ws://localhost:7860/text2text";

function App() {
  const [chatMessages, setChatMessages] = useState(chatMessageObjects);
  const [conversationState, setConversationState] =
    useState<ConversationState>("ready");
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(URI, {
    shouldReconnect: () => true,
    reconnectInterval: 5000,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    const websocketResponse = JSON.parse(lastMessage.data) as WebSocketResponse;

    if (websocketResponse.type === "debug") {
      console.log(websocketResponse.detail);
    } else if (websocketResponse.type === "error") {
      setConversationState("error");
      setErrorMessage(websocketResponse.detail);
      console.error(websocketResponse.detail);
    } else if (websocketResponse.type === "start") {
      setConversationState("streaming");

      setChatMessages((chatMessages) => [
        ...chatMessages,
        {
          id: chatMessages.length,
          type: "text",
          sender: "bot",
          message: "",
          complete: false,
        },
      ]);
    } else if (websocketResponse.type === "stream") {
      setChatMessages((chatMessages) => {
        const lastChatMessage = chatMessages[chatMessages.length - 1];
        const rest = chatMessages.slice(0, -1);

        return [
          ...rest,
          {
            ...lastChatMessage,
            message: lastChatMessage.message + websocketResponse.output,
          },
        ];
      });
    } else if (websocketResponse.type === "end") {
      setChatMessages((chatMessages) => {
        const lastChatMessage = chatMessages[chatMessages.length - 1];
        const rest = chatMessages.slice(0, -1);
        return [
          ...rest,
          {
            ...lastChatMessage,
            complete: true,
          },
        ];
      });
      setConversationState("ready");
    }
  }, [lastMessage]);

  useEffect(() => {
    if (conversationState === "error") {
      const timeout = setTimeout(() => {
        setConversationState("ready");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [conversationState]);

  const sendQuestion = (question: string) => {
    const webSocketRequest: WebSocketRequest = {
      type: "question",
      question: question,
    };
    sendJsonMessage(webSocketRequest);
  };

  const onChatInput = (message: string) => {
    if (conversationState === "ready") {
      setChatMessages((chatMessages) =>
        chatMessages.concat([
          {
            id: chatMessages.length,
            type: "input",
            sender: "self",
            message: message,
            complete: true,
          },
        ])
      );
      if (SEND_REQUESTS) {
        setConversationState("waiting");
        sendQuestion(message);
      }
      setErrorMessage(null);
    }
  };

  return (
    <div className="flex flex-col min-w-[800px] min-h-[100vh] bg-palette-neutral-bg-strong">
      <div className="p-6 mx-auto mt-20 rounded-lg bg-palette-neutral-bg-weak min-h-[6rem] min-w-[18rem] max-w-4xl ">
        {readyState === ReadyState.OPEN && (
          <>
            <ChatContainer
              chatMessages={chatMessages}
              loading={conversationState === "waiting"}
            />
            <ChatInput
              onChatInput={onChatInput}
              loading={conversationState === "waiting"}
            />
            {errorMessage}
          </>
        )}{" "}
        {readyState === ReadyState.CONNECTING && <div>Connecting...</div>}
        {readyState === ReadyState.CLOSED && (
          <div className="flex flex-col">
            <div>Could not connect to server, reconnecting...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
