import type { KeyboardEvent } from "react";

export type ChatInputProps = {
  onChatInput?: (chatText: string) => void;
  loading?: boolean
};

function ChatInput(props: ChatInputProps) {
  const { onChatInput, loading } = props;
  const onInputKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // @ts-ignore
    if(!loading && event.key === 'Enter' && event.target?.value !== null && onChatInput) {
      event.preventDefault(); // needed to prevent newline from sticking around even after clearing the value...
      // @ts-ignore
      onChatInput(event.target.value);
      // @ts-ignore
      event.target.value = "";
      // @ts-ignore
      event.target.rows = 1;
      
    }
  };

  return (
    <div className="flex flex-col max-w-4xl">
      {/* @ts-ignore */}
      <textarea onKeyDown={onInputKeyPress} disabled={loading} enterKeyHint="send" tabIndex={0} rows={1} className="m-0 h-full w-full resize-none scroll-p-3 overflow-x-hidden overflow-y-scroll border-0 bg-transparent p-3 outline-none focus:ring-0 focus-visible:ring-0" placeholder="Ask anything"></textarea>
    </div>
  );
}

export default ChatInput;
