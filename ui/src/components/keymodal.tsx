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
      className="ndl-modal ndl-dialog ndl-with-close-button ndl-medium"
    >
      <button role="button" aria-label="close" className="ndl-icon-btn ndl-dialog-close ndl-large ndl-clean" onClick={onCloseModal}>
        <div className="ndl-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
      </button>
      <div className="flex flex-nowrap">
        <div className="flex flex-col flex-1 w-full">
          <h4 className="ndl-dialog-header">API Key</h4>
          <div className="ndl-dialog-subtitle body-large">Please enter your OpenAI API Key</div>
        </div>
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
