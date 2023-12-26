const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri:
      "http://localhost:8080//auth/realms/WhiteboardRealm/protocol/openid-connect/certs",
  }),
  audience: "whiteboard-client",
  issuer: "http://localhost:8080//auth/realms/WhiteboardRealm",
  algoithms: ["RS256"],
});

module.exports = checkJwtl;
