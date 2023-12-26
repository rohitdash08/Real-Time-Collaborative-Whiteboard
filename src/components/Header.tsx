import React from "react";
import keycloak from "../config/keycloak";
import "./Header.css";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const username = keycloak?.authenticated
    ? keycloak.tokenParsed?.preferred_username
    : "";

  const handleLogout = () => {
    keycloak.logout();
  };

  return (
    <header className="navbar navbar-dark bg-dark">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand mb-0 h1">
          Whiteboard
        </Link>
        {keycloak?.authenticated && (
          <div className="d-flex">
            <span className="me-3">Hello, {username}</span>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
