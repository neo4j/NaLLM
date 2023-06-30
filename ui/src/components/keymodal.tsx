import Modal from "react-modal";

type KeyModalProps = {
  isOpen: boolean;
  apiKey: string;
  onRequestClose?: () => void;
  onCloseModal: () => void;
  onApiKeyChanged: (key: string) => void;
};

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};
const inputClassNames = "";


function KeyModal(props: KeyModalProps) {
  const { isOpen, apiKey, onRequestClose, onCloseModal, onApiKeyChanged } = props;
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customModalStyles}
      contentLabel="Enter Open API Key"
    >
      <div className="flex justify-end">
        <button onClick={onCloseModal}>close</button>
      </div>
      <div className="flex">
        <h2>Please Enter Your OpenAI API Key</h2>
        
      </div>
      <form>
        <div className="ndl-form-item">
          {/*
          // @ts-ignore */}
          <input type="text" onChange={(e: Event) => { onApiKeyChanged(e.target.value); }} className={inputClassNames} value={apiKey} />
        </div>
      </form>
    </Modal>
  );
}

export default KeyModal;
