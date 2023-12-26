import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import keycloak, { initKeycloak } from "./config/keycloak";
import HomePage from "./components/HomePage";
import Whiteboard from "./components/Whiteboard";
import Header from "./components/Header";
import JoinWhiteboardPage from "./components/JoinWhiteboardPage";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeKeycloak = async () => {
      try {
        await initKeycloak();
        if (keycloak) {
          setAuthenticated(keycloak.authenticated === true || false);
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing Keycloak", error);
        setAuthenticated(false);
      }
    };
    initializeKeycloak();
  }, []);

  return (
    <Router>
      <Header />
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/whiteboard/:roomId"
            element={<Whiteboard isNew={false} />}
          />
          <Route path="/whiteboard/join" element={<JoinWhiteboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
