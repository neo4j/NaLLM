import ChatMessage, { ChatMessageObject } from "./ChatMessage";

export type ChatContainerProps = {
  chatMessages: ChatMessageObject[]
};

function ChatContainer(props: ChatContainerProps) {
  const { chatMessages = [] } = props;
  return (
    <div className="flex flex-col w-full bg-base-300 rounded-b-box rounded-tr-box relative overflow-x-auto">
      <div className="preview border-base-300 bg-base-200 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4">
        <div className="w-full">
          {chatMessages.map(chatMessage => (
            <ChatMessage key={chatMessage.id} chatMessage={chatMessage} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;