import type { KeyboardEvent  } from "react";

export type ChatInputProps = {
  onChatInput?: (chatText: string) => void;
};

function ChatInput(props: ChatInputProps) {
  const onInputKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // @ts-ignore
    if(event.key === 'Enter' && event.target?.value !== null && props.onChatInput) {
      // @ts-ignore
      props.onChatInput(event.target.value);
      
    }
  };

  return (
    <div className="flex flex-col max-w-4xl">
      {/* @ts-ignore */}
      <textarea onKeyDown={onInputKeyPress} enterKeyHint="send" tabIndex={0} rows={1} className="m-0 h-full w-full resize-none scroll-p-3 overflow-x-hidden overflow-y-scroll border-0 bg-transparent p-3 outline-none focus:ring-0 focus-visible:ring-0" placeholder="Ask anything"></textarea>
    </div>
  );
}

export default ChatInput;
