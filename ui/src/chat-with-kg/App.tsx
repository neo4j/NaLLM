import { useState } from "react";
import ChatContainer from "./ChatContainer";
import type { ChatMessageObject } from "./ChatMessage";
import ChatInput from "./ChatInput";
import { fetchQuestionAnswer } from "./utils/fetch-utils";

const chatMessageObjects: ChatMessageObject[] = [
  {
    id: 0,
    type: "input",
    message: "This is the first message which has decently long text and would denote something typed by the user"
  },
  {
    id: 1,
    type: "text",
    message: "And here is another message which would denote a response from the server, which for now will only be text"
  }
];

function App() {
  const [chatMessages, setChatMesages] = useState(chatMessageObjects);
  const [loading, setLoading] = useState(false);

  const onChatInput = (message: string) => {
    if (!loading) {
      setChatMesages(chatMessages => chatMessages.concat([{
        id: chatMessages.length,
        type: "input",
        message: message
      }]));
      setLoading(true);
      fetchQuestionAnswer(message).then(response => {
        setChatMesages(chatMessages => chatMessages.concat([{
          id: chatMessages.length,
          type: "text",
          message: response
        }]));
      }, error => {
        setChatMesages(chatMessages => chatMessages.concat([{
          id: chatMessages.length,
          type: "error",
          message: "Oops, an error occurred"
        }]));
      });
    }
  }

  return (
    <div className="flex flex-col min-w-[800px] min-h-[100vh]">
      <ChatContainer chatMessages={chatMessages} />
      <ChatInput onChatInput={onChatInput} />
    </div>
  );
}

export default App;
