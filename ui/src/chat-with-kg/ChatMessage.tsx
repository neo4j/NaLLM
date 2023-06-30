export type ChatMessageObject = {
  id: number;
  type: "input" | "text" | "error";
  message: string;
  cypher?: string | null;
  sender: "bot" | "self";
  complete: boolean;
};

export type ChatMessageProps = {
  chatMessage: ChatMessageObject;
};

function ChatMessage(props: ChatMessageProps) {
  const { chatMessage } = props;
  const { type, message, sender, cypher } = chatMessage;
  const chatClass = `flex flex-row relative max-w-full ${
    sender === "bot" ? "self-start mr-10" : "ml-10 self-end"
  }`;

  return (
    <div className={chatClass}>
      {sender === "bot" && <ChatMessageTail side="left" />}
      <div
        className={`min-w-0 px-4 py-2 rounded-t-lg bg-palette-primary-bg-strong text-palette-neutral-text-inverse break-all ${
          sender === "bot" ? "rounded-br-lg" : "rounded-bl-lg"
        }`}
      >
        {message}
        {sender === "bot" && cypher && <ChatCypherDetail cypher={cypher} />}
      </div>
      {sender === "self" && <ChatMessageTail side="right" />}
    </div>
  );
}

function ChatMessageTail({ side }: { side: "left" | "right" }) {
  const chatTailStyle: React.CSSProperties = {
    width: "0.75rem",
    height: "0.75rem",
    WebkitMaskImage: `url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMycgaGVpZ2h0PSczJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxwYXRoIGZpbGw9J2JsYWNrJyBkPSdtIDAgMyBMIDMgMyBMIDMgMCBDIDMgMSAxIDMgMCAzJy8+PC9zdmc+)`,
    maskImage: `url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMycgaGVpZ2h0PSczJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxwYXRoIGZpbGw9J2JsYWNrJyBkPSdtIDAgMyBMIDMgMyBMIDMgMCBDIDMgMSAxIDMgMCAzJy8+PC9zdmc+)`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  };

  if (side === "left") {
    chatTailStyle["left"] = "-0.75rem";
  } else {
    chatTailStyle["right"] = "-0.75rem";
    chatTailStyle["WebkitTransform"] = "scaleX(-1)";
  }

  return (
    <div
      className="absolute bottom-0 bg-palette-primary-bg-strong"
      style={chatTailStyle}
    ></div>
  );
}

function ChatCypherDetail({ cypher }: { cypher: string }) {
  return (
    <details>
      <summary className="">Cypher</summary>
      <div className="min-w-0 px-4 py-2 rounded-lg bg-palette-primary-bg-weak text-palette-neutral-text-default">
        {cypher}
      </div>
    </details>
  );
}

export default ChatMessage;
