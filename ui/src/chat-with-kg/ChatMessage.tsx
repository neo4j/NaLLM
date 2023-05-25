export type ChatMessageObject = {
  id: number,
  type: "input" | "text" | "error",
  message: string
};

export type ChatMessageProps = {
  chatMessage: ChatMessageObject
}

function ChatMessage(props: ChatMessageProps) {
  const { chatMessage } = props;
  const { type, message } = chatMessage;
  const chatClass = "chat " + (type === "input" ? "chat-start" : "chat-end");
  return (
    <div className={chatClass}>
      <div className="chat-bubble">{message}</div>
    </div>
  );
}

export default ChatMessage;