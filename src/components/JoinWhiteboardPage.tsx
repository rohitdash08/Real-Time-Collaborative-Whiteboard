import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./JoinWhiteboardPage.css";

const JoinWhiteboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [inputValue, setInputValue] = useState(roomId || "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleJoinWhiteboard = () => {
    const trimmedValue = inputValue.trim();

    if (trimmedValue !== "") {
      navigate(`/whiteboard/${trimmedValue}`);
    } else {
      alert("Please enter a valid room ID");
    }
  };

  return (
    <div className="container">
      <h2>Join Existing whiteboard</h2>
      <div className="form-container">
        <label className="form-label">Enter Room ID:</label>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>
      <button onClick={handleJoinWhiteboard} className="btn btn-primary">
        Join Room
      </button>
    </div>
  );
};

export default JoinWhiteboardPage;
