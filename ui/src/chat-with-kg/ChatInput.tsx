import { useState, useEffect, KeyboardEvent } from "react";
export type ChatInputProps = {
  onChatInput?: (chatText: string) => void;
  loading?: boolean;
  sampleQuestions: string[]
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
  const { onChatInput, loading, sampleQuestions } = props;
  const [inputText, setInputText] = useState("");

  const [sampleQuestionIndex, setSampleQuestionIndex] = useState(0);

  useEffect(() => {
    setSampleQuestionIndex(0);
  }, [sampleQuestions])

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

  const sampleQuestionLeft = () => {
    if (sampleQuestionIndex > 0) {
      setSampleQuestionIndex(sampleQuestionIndex - 1);
    }
  };

  const sampleQuestionRight = () => {
    if (sampleQuestionIndex < sampleQuestions.length - 1) {
      setSampleQuestionIndex(sampleQuestionIndex + 1);
    }
  };

  const onSampleQuestionClick = () => {
    const sampleQuestion = sampleQuestions[sampleQuestionIndex];
    if (onChatInput && sampleQuestion !== undefined) {
      onChatInput(sampleQuestion);
    }
  };

  return (
    <div className="flex flex-col max-w-4xl gap-2">
      <div className="flex flex-row w-full">
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
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              ></path>
            </svg>
          </div>
        </button>
      </div>
      {sampleQuestions && sampleQuestions.length > 0 && (
        <>
          <div className="flex justify-center">Sample Questions</div>
          <div className="flex flex-row w-full">
            <div className="flex flex-none">
              <button
                className="flex self-center ndl-icon-btn ndl-large"
                onClick={sampleQuestionLeft}
                disabled={sampleQuestionIndex <= 0}
              >
                <div className="ndl-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                </div>
              </button>
            </div>
            <div className="flex flex-auto m-2 cursor-pointer" onClick={onSampleQuestionClick}>{sampleQuestions[sampleQuestionIndex]}</div>
            <div className="flex flex-none">
              <button
                className="flex self-center ndl-icon-btn ndl-large"
                onClick={sampleQuestionRight}
                disabled={sampleQuestionIndex >= sampleQuestions.length - 1}
              >
                <div className="ndl-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatInput;
