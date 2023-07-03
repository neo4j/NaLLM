import { useCallback, useEffect, useState, ChangeEvent } from "react";
import ChatContainer from "./ChatContainer";
import type { ChatMessageObject } from "./ChatMessage";
import ChatInput from "./ChatInput";
import useWebSocket, { ReadyState } from "react-use-websocket";
import KeyModal from "../components/keymodal";
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

const HAS_API_KEY_URI =
  import.meta.env.VITE_HAS_API_KEY_ENDPOINT ??
  "http://localhost:7860/hasapikey";

const QUESTIONS_URI =
  import.meta.env.VITE_KG_CHAT_SAMPLE_QUESTIONS_ENDPOINT ??
  "http://localhost:7860/questionProposalsForCurrentDb";

function loadKeyFromStorage() {
  return localStorage.getItem("api_key");
}

const QUESTION_PREFIX_REGEXP = /^[0-9]{1,2}[\w]*[\.\)\-]*[\w]*/;

function stripQuestionPrefix(question: string): string {
  if (question.match(QUESTION_PREFIX_REGEXP)) {
    return question.replace(QUESTION_PREFIX_REGEXP, "");
  }
  return question;
}

function App() {
  const [serverAvailable, setServerAvailable] = useState(true);
  const [needsApiKeyLoading, setNeedsApiKeyLoading] = useState(true);
  const [needsApiKey, setNeedsApiKey] = useState(true);
  const [chatMessages, setChatMessages] = useState(chatMessageObjects);
  const [conversationState, setConversationState] =
    useState<ConversationState>("ready");
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(URI, {
    shouldReconnect: () => true,
    reconnectInterval: 5000,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(loadKeyFromStorage() || "");
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);
  const [text2cypherModel, setText2cypherModel] = useState<string>("gpt-3.5-turbo-0613");

  const showContent = serverAvailable && !needsApiKeyLoading;

  function loadSampleQuestions() {
    const body = {
      api_key: apiKey,
    };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    fetch(QUESTIONS_URI, options).then(
      (response) => {
        response.json().then(
          (result) => {
            if (result.output && result.output.length > 0) {
              setSampleQuestions(result.output.map(stripQuestionPrefix));
            } else {
              setSampleQuestions([]);
            }
          },
          (error) => {
            setSampleQuestions([]);
          }
        );
      },
      (error) => {
        setSampleQuestions([]);
      }
    );
  }

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
                loadSampleQuestions();
              } else {
                setModalIsOpen(true);
              }
            } else {
              loadSampleQuestions();
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

  useEffect(() => {
    if (!lastMessage || !serverAvailable) {
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
            cypher: websocketResponse.generated_cypher,
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
    if (serverAvailable && !needsApiKeyLoading && needsApiKey && apiKey) {
      webSocketRequest.api_key = apiKey;
    }
    webSocketRequest.model_name = text2cypherModel;
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

  const openModal = () => {
    setModalIsOpen(true);
  };

  const onCloseModal = () => {
    setModalIsOpen(false);
    if (apiKey && sampleQuestions.length === 0) {
      loadSampleQuestions();
    }
  };

  const onApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem("api_key", newApiKey);
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setText2cypherModel(e.target.value)
  }

  return (
    <div className="flex flex-col min-w-[800px] min-h-[100vh] bg-palette-neutral-bg-strong">
      {needsApiKey && (
        <div className="flex justify-end mr-4">
          <button onClick={openModal}>API Key</button>
        </div>
      )}
        <div className="flex justify-end mr-4">
        <select value={text2cypherModel} onChange={handleModelChange}>
            <option value="gpt-3.5-turbo-0613">gpt-3.5-turbo</option>
            <option value="gpt-4">gpt-4</option>
        </select>
        </div>
      <div className="p-6 mx-auto mt-20 rounded-lg bg-palette-neutral-bg-weak min-h-[6rem] min-w-[18rem] max-w-4xl ">
        {!serverAvailable && (
          <div>Server is unavailable, please reload the page to try again.</div>
        )}
        {serverAvailable && needsApiKeyLoading && <div>Initializing...</div>}
        <KeyModal
          isOpen={showContent && needsApiKey && modalIsOpen}
          onCloseModal={onCloseModal}
          onApiKeyChanged={onApiKeyChange}
          apiKey={apiKey}
        />
        {showContent && readyState === ReadyState.OPEN && (
          <>
            <ChatContainer
              chatMessages={chatMessages}
              loading={conversationState === "waiting"}
            />
            <ChatInput
              onChatInput={onChatInput}
              loading={conversationState === "waiting"}
              sampleQuestions={sampleQuestions}
            />
            {errorMessage}
          </>
        )}{" "}
        {showContent && readyState === ReadyState.CONNECTING && (
          <div>Connecting...</div>
        )}
        {showContent && readyState === ReadyState.CLOSED && (
          <div className="flex flex-col">
            <div>Could not connect to server, reconnecting...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
