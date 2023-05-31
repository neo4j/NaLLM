import ChatMessage, { ChatMessageObject } from "./ChatMessage";

export type ChatContainerProps = {
  chatMessages?: ChatMessageObject[];
  loading?: boolean;
};

const loadingMessage: ChatMessageObject = {
  id: -1,
  type: "text",
  message: "Loading...",
  sender: "bot",
  complete: true,
};

function ChatContainer(props: ChatContainerProps) {
  const { chatMessages = [], loading } = props;
  return (
    <div className="relative flex flex-col w-full min-w-[800px] overflow-x-auto rounded-b-box rounded-tr-box">
      <div className="flex flex-wrap items-center justify-center gap-2 p-4 overflow-x-hidden bg-top bg-cover preview">
        <div className="flex flex-col w-full gap-2">
          {chatMessages.map((chatMessage) => (
            <ChatMessage key={chatMessage.id} chatMessage={chatMessage} />
          ))}
          {loading && <ChatMessage chatMessage={loadingMessage} />}
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;
