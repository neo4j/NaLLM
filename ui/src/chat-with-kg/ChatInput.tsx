import { useState, KeyboardEvent } from "react";
export type ChatInputProps = {
  onChatInput?: (chatText: string) => void;
  loading?: boolean;
};

//Needed since the types for react don't include enterKeyHint
declare module "react" {
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    enterKeyHint?:
      | "enter"
      | "done"
      | "go"
      | "next"
      | "previous"
      | "search"
      | "send";
  }
}

function ChatInput(props: ChatInputProps) {
  const { onChatInput, loading } = props;
  const [inputText, setInputText] = useState("");

  const onInputKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!loading && event.key === "Enter") {
      handleSend();
    }
  };

  const handleSend = () => {
    if (!loading && inputText !== "" && onChatInput) {
      onChatInput(inputText);
      setInputText("");
    }
  };

  return (
    <div className="flex flex-row max-w-4xl gap-2">
      {/* @ts-ignore */}
      <textarea
        enterKeyHint="send"
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={onInputKeyPress}
        disabled={loading}
        value={inputText}
        rows={1}
        className="w-full max-w-full p-3 m-0 overflow-x-hidden overflow-y-auto bg-transparent border rounded-md outline-none resize-none scroll-p-3 focus:ring-0 focus-visible:ring-0 border-palette-neutral-bg-strong"
        placeholder="Ask something about your database"
      ></textarea>
      <button
        className="flex self-center ndl-icon-btn ndl-large"
        onClick={handleSend}
      >
        <div className="ndl-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="w-6 h-6 text-light-neutral-text-weak"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            ></path>
          </svg>
        </div>
      </button>
    </div>
  );
}

export default ChatInput;
