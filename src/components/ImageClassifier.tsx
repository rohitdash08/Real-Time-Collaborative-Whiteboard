import React, { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./ImageClassifier.css";

interface ImageClassifierProps {
  onClassify: (
    image: string,
    predictions: { label: string; probability: number }[]
  ) => Promise<void>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  image: string | null;
}

const ImageClassifier: React.FC<ImageClassifierProps> = ({
  onClassify,
  showModal,
  setShowModal,
  image,
}) => {
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<
    { label: string; probability: number }[]
  >([]);

  const handleClassify = async () => {
    try {
      setIsClassifying(true);

      const imageElement = document.createElement("img");
      imageElement.src = image!;
      await tf.ready();
      const model = await mobilenet.load();
      const tfPredictions = await model.classify(imageElement);

      const newPredictions = tfPredictions.map((p) => ({
        label: p.className,
        probability: p.probability,
      }));

      await onClassify(image!, newPredictions);

      setPredictions(newPredictions);
    } catch (error) {
      console.error("Error in classification", error);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <Modal
      show={showModal}
      onHide={() => setShowModal(false)}
      dialogClassName="image-classifier-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Image Classification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="canvas-image-container">
          <img
            src={image ?? undefined}
            alt="Canvas for Classification"
            className="canvas-image"
          />
        </div>
        {isClassifying ? (
          <>
            <Spinner
              animation="border"
              role="status"
              className="classify-spinner"
            >
              <span className="visually-hidden">
                Performing image classification...
              </span>
            </Spinner>

            <p>Performing image classification...</p>
          </>
        ) : (
          <div>
            <Button
              variant="primary"
              onClick={handleClassify}
              className="classify-button"
              disabled={isClassifying}
            >
              Classify Image
            </Button>
            <div className="predictions">
              <h5>Image Classification Predictions:</h5>
              <ul>
                {predictions.map((result, index) => (
                  <li key={index}>
                    <strong>{`Prediction ${index + 1}: `}</strong>
                    {`${result.label} - ${(result.probability * 100).toFixed(
                      2
                    )}%`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageClassifier;
