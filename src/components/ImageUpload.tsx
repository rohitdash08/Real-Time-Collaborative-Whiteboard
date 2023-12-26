import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Card, Modal } from "react-bootstrap";
import "./ImageUpload.css";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const reader = new FileReader();

      reader.onload = () => {
        const imageDataUrl = reader.result as string;
        onImageUpload(imageDataUrl);
        handleCloseModal();
      };

      if (acceptedFiles.length > 0) {
        reader.readAsDataURL(acceptedFiles[0]);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="drop-container">
      <Card className="dropzone-container">
        <Card.Body>
          <Button
            variant="btn btn-primary"
            onClick={handleShowModal}
            className="btn-select-image"
          >
            Upload Image
            <i className="bi bi-upload" />
          </Button>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title">Select Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the image here</p>
            ) : (
              <p>Drag & drop an image here, or click to select one</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ImageUpload;
