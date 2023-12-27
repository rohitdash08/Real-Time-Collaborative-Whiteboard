import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface InviteButtonProps {
  onInviteClick: (emails: string[]) => void;
}

const InviteButton: React.FC<InviteButtonProps> = ({ onInviteClick }) => {
  const [showModal, setShowModal] = useState(false);
  const [emailList, setEmailList] = useState<string>("");

  const handleInviteClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleInvite = () => {
    const emails = emailList.split(",").map((email) => email.trim());
    onInviteClick(emails);
    setShowModal(false);
  };

  return (
    <div>
      <Button variant="link" onClick={handleInviteClick}>
        <i className="bi bi-envelope"></i>
      </Button>

      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Invite Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formEmails">
              <Form.Label>Enter emails (comma-separated):</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter emails"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleInvite}>
            Send Invite
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InviteButton;
