// keycloak configuration

import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: "http://localhost:8080/auth",
  realm: "WhiteboardRealm",
  clientId: "whiteboard-client",
  enableLogging: true,
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = () => {
  return keycloak
    .init({
      onLoad: "login-required",
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      if (authenticated) {
        console.log("Keycloak initialized and user is authenticated");
      } else {
        console.log("Keycloak initialized, but user is not authenticated");
      }
      return keycloak;
    });
};

export default keycloak;
