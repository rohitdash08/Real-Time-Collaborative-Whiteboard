import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNewWhiteboard = () => {
    const roomId: string = uuidv4();
    navigate(`/whiteboard/${roomId}`);
  };

  const handleJoinExistingWhiteboard = () => {
    navigate(`/whiteboard/join`);
  };

  return (
    <div className="container-fluid">
      <div className="container mt-4">
        <h2>Welcome to the Real-Time Collaborative Whiteboard</h2>
        <div className="line"></div>
        <div className="btn-container">
          <button
            className="btn btn-primary btn-create-whiteboard"
            onClick={handleNewWhiteboard}
          >
            Create New Whiteboard
          </button>
          <button
            className="btn btn-primary btn-create-whiteboard"
            onClick={handleJoinExistingWhiteboard}
          >
            Join Existing Whiteboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
