import React, { useRef, useEffect, useState } from "react";
import { fabric } from "fabric";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { io, Socket } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Whiteboard.css";
import { useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Modal,
  Navbar,
  Row,
  Toast,
} from "react-bootstrap";
import ImageUpload from "./ImageUpload";
import ImageClassifier from "./ImageClassifier";

interface WhiteboardProps {
  isNew: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isNew }) => {
  const { roomId } = useParams();
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(1);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(true);
  const [classificationImage, setClassificationImage] = useState<string | null>(
    null
  );
  const [classificationResult, setClassificationResult] = useState<number[]>(
    []
  );
  const [showClassifierModal, setShowClassifierModal] =
    useState<boolean>(false);

  const history = useRef<Array<string>>([]);
  const redoHistory = useRef<Array<string>>([]);
  const cursors = useRef<Record<string, fabric.Object>>({});

  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io("http://localhost:3001", {
      query: { roomId },
    });
    console.log(`connected to ${roomId}`);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    const canvasInstance = new fabric.Canvas("whiteboard-canvas", {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    canvasInstance.freeDrawingBrush.color = brushColor;
    canvasInstance.freeDrawingBrush.width = brushSize;

    canvasInstance.on("path:created", () => {
      const jsonString = JSON.stringify(canvasInstance.toJSON());
      history.current.push(jsonString);
      redoHistory.current = [];

      if (socket.current) {
        socket.current.emit("draw", {
          userId: "uniqueUserId",
          action: jsonString,
        });
      }
    });

    history.current.push(JSON.stringify(canvasInstance.toJSON()));
    canvasRef.current = canvasInstance;

    if (!isNew && roomId && socket.current) {
      socket.current.emit("joinRoom", { roomId });
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
      }

      if (!isNew && roomId && socket.current) {
        socket.current.emit("leaveRoom", { roomId });
      }
    };
  }, [brushColor, brushSize, isNew, roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setZoom(zoom);
      canvas.renderAll();
      canvas.selection = isDrawingMode;
    }
  }, [zoom, isDrawingMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [brushColor, brushSize]);

  useEffect(() => {
    const handleDraw = (data: any) => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.loadFromJSON(data.action, () => {
          canvas.renderAll();
        });
      }
    };

    const handleCursorMove = ({ id, position }: any) => {
      const cursor = cursors.current[id];
      if (cursor) {
        cursor.set({ left: position.x, top: position.y });
        canvasRef.current?.renderAll();
      } else {
        const newCursor = new fabric.Circle({
          radius: 5,
          fill: "red",
          originX: "center",
          originY: "center",
          left: position.x,
          top: position.y,
          selectable: false,
        });
        cursors.current[id] = newCursor;
        canvasRef.current?.add(newCursor);
      }
    };

    if (socket.current) {
      socket.current.on("draw", handleDraw);
      socket.current.on("cursorMove", handleCursorMove);
    }

    return () => {
      if (socket.current) {
        socket.current.off("draw", handleDraw);
        socket.current.off("cursorMove", handleCursorMove);
      }
    };
  }, [socket]);

  const zoomToPoint = (
    canvas: fabric.Canvas,
    point: fabric.Point,
    newZoom: number
  ) => {
    canvas.zoomToPoint(point, newZoom);
  };

  // Brush color & size
  const handleColorChange = (color: string) => {
    setBrushColor(color);
  };

  const handleSizeChange = (size: number) => {
    setBrushSize(size);
    if (canvasRef.current) {
      canvasRef.current.freeDrawingBrush.width = size;
    }
  };

  // undo
  const undo = () => {
    if (history.current.length > 1) {
      const currentCanvasState = history.current.pop();
      const previousCanvasState = history.current[history.current.length - 1];

      if (currentCanvasState) {
        canvasRef.current?.loadFromJSON(
          previousCanvasState,
          canvasRef.current.renderAll.bind(canvasRef.current)
        );

        redoHistory.current.push(currentCanvasState);
      }
    }
  };

  // redo
  const redo = () => {
    if (redoHistory.current.length > 0) {
      const nextCanvasState = redoHistory.current.pop();

      if (nextCanvasState) {
        canvasRef.current?.loadFromJSON(
          nextCanvasState,
          canvasRef.current.renderAll.bind(canvasRef.current)
        );

        history.current.push(nextCanvasState);
      }
    }
  };

  // Zoom in
  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newZoom = Math.min(3, zoom + 0.1);
      setZoom(newZoom);
      zoomToPoint(
        canvas,
        new fabric.Point(window.innerWidth / 2, window.innerHeight / 2),
        newZoom
      );
    }
  };

  // Zoom out
  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newZoom = Math.max(0.5, zoom - 0.1);
      setZoom(newZoom);
      zoomToPoint(
        canvas,
        new fabric.Point(window.innerWidth / 2, window.innerHeight / 2),
        newZoom
      );
    }
  };

  // Save Whiteboard PDF or PNG
  const saveWhiteboard = async (saveAsPDF: boolean) => {
    const canvas = canvasRef.current;

    if (canvas) {
      canvas.isDrawingMode = false;

      const originalState = canvas.toJSON();

      try {
        let imgData: string;

        if (saveAsPDF) {
          const tempCanvas = new fabric.Canvas(null, {
            width: window.innerWidth,
            height: window.innerHeight,
          });

          tempCanvas.loadFromJSON(originalState, () => {
            const tempCanvasImage = tempCanvas.toDataURL({ format: "png" });
            imgData = tempCanvasImage;

            const pdf = new jsPDF("p", "mm", "a4");
            pdf.addImage(
              imgData,
              "PNG",
              0,
              0,
              pdf.internal.pageSize.width,
              pdf.internal.pageSize.height
            );
            pdf.save("whiteboard.pdf");

            canvas.isDrawingMode = true;
            canvas.renderAll();
          });
        } else {
          const canvasImage = await html2canvas(
            canvas.getElement() as HTMLElement,
            { useCORS: true }
          );
          imgData = canvasImage.toDataURL();
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "whiteboard.png";
          link.click();
        }
      } catch (error) {
        console.error("Error capturing canvas:", error);
      } finally {
        canvas.isDrawingMode = true;
        canvas.loadFromJSON(originalState, () => {
          canvas.renderAll();
          setShowSaveModal(false);
        });
      }
    }
  };

  // Image Upload
  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    if (canvasRef.current) {
      fabric.Image.fromURL(imageUrl, (img) => {
        const canvas = canvasRef.current!;
        const canvasWidth = canvasRef.current!.width ?? 0;
        const canvasHeight = canvasRef.current!.height ?? 0;

        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
        });

        img.on("selected", () => {
          console.log("Image selected!");
        });

        img.on("deselected", () => {
          console.log("Image deselected!");
        });

        canvas.add(img);
        canvas.renderAll();
      });
    }
  };

  const handleHover = (hover: boolean) => {
    if (!showSaveModal) {
      setIsHovered(hover);
    }
  };

  const handleToggleMode = () => {
    setIsDrawingMode(!isDrawingMode);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.isDrawingMode = !isDrawingMode;
    }
  };

  const handleShowClassifierModal = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageDataURL = canvas.toDataURL();
      setClassificationImage(imageDataURL);
      setShowClassifierModal(true);
    }
  };

  const handleClassifierComplete = async (
    image: string,
    predictions: { label: string; probability: number }[]
  ): Promise<void> => {
    const predictionProbabilities = predictions.map(
      (prediction) => prediction.probability
    );
    setClassificationResult(predictionProbabilities);
  };

  const handleToggleClassifierModal = () => {
    setShowClassifierModal(!showClassifierModal);
  };

  return (
    <div className="whiteboard-container">
      <Toast
        className="room-id-toast"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
      >
        <Toast.Header closeButton={false}>
          <strong className="room-id-title">Room ID</strong>
        </Toast.Header>
        <Toast.Body className="room-id-text">{roomId}</Toast.Body>
      </Toast>

      <div id="whiteboard-border">
        <canvas
          id="whiteboard-canvas"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        />
      </div>

      <div className="bottom-controls">
        <ImageUpload onImageUpload={handleImageUpload} />

        <Card className="toolbox">
          <Card.Body className="d-flex justify-content-between align-items-center">
            <ButtonGroup
              className="me-2"
              aria-label="Drawing and Select"
              style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)" }}
            >
              <Button
                variant={`outline-primary ${isDrawingMode ? "" : "active"}`}
                onClick={handleToggleMode}
              >
                {isDrawingMode ? "Select" : "Draw"}
              </Button>
            </ButtonGroup>

            <div
              className="btn-toolbar"
              role="toolbar"
              aria-label="Toolbar with button groups"
            >
              <div
                className="btn-group me-2"
                role="group"
                aria-label="Brush controls"
              >
                <button
                  className="btn btn-outline-secondary"
                  style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)" }}
                >
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="bi bi-brush"
                  />
                </button>

                <button
                  className="btn btn-outline-secondary"
                  style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)" }}
                >
                  <i className="bi bi-pencil">
                    <input
                      type="number"
                      value={brushSize}
                      onChange={(e) => handleSizeChange(Number(e.target.value))}
                      className="Brush-size"
                      style={{
                        height: "30px",
                        width: "80px",
                        marginLeft: "10px",
                      }}
                    />
                  </i>
                </button>
              </div>

              <div
                className="btn-group me-2"
                role="group"
                aria-label="Action controls"
                style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)" }}
              >
                <button
                  className="btn btn-outline-secondary"
                  onClick={undo}
                  title="Undo"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={redo}
                  title="Redo"
                >
                  <i className="bi bi-arrow-clockwise" />
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={handleZoomIn}
                  title="Zoom in"
                >
                  <i className="bi bi-zoom-in" />
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <i className="bi bi-zoom-out" />
                </button>
              </div>
            </div>

            <Button
              variant="btn btn-primary classify"
              onClick={handleShowClassifierModal}
              title="Classify Image"
            >
              Click to Classify Image
              <br />
              <i className="bi bi-box-seam"></i>
            </Button>

            <ButtonGroup className="me-2" aria-label="Drawing and Select">
              <Button
                className={`save-button outline-secondary ${
                  isHovered ? "hovered" : ""
                }`}
                onMouseEnter={() => handleHover(true)}
                onMouseLeave={() => handleHover(false)}
                onClick={() => setShowSaveModal(!showSaveModal)}
                title="Save"
              >
                Save Canvas <br />
                <i className="bi bi-download"></i>
              </Button>
            </ButtonGroup>

            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Save Whiteboard</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Select the format to save your Whiteboard:</p>
                <Button variant="primary" onClick={() => saveWhiteboard(true)}>
                  Save as PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => saveWhiteboard(false)}
                >
                  Save as Image
                </Button>
              </Modal.Body>
            </Modal>

            <ImageClassifier
              onClassify={handleClassifierComplete}
              showModal={showClassifierModal}
              setShowModal={handleToggleClassifierModal}
              image={classificationImage}
            />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Whiteboard;
