import React from 'react';
import './Modal.css'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // Content to render inside the modal
  title?: string; // Optional title for the modal
  modalClassName?: string; // Optional additional class for the modal div
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, modalClassName }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div
        className={`modal-container ${modalClassName || ''}`} // modal-container for the rectangular box
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;