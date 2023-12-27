const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const Keycloak = require("keycloak-connect");
const { Pool } = require("pg");
const cors = require("cors");
const axios = require("axios");

const app = express();
const server = require("http").createServer(app);

// Keycloak
const keycloak = new Keycloak({
  realm: "WhiteboardRealm",
  "auth-server-url": "http://localhost:8080/auth",
  "bearer-only": true,
  "client-id": "whiteboard-client",
  "client-secret": "Acxx5vgEB3BOf86t9u6Yu9roMSWAteKe",
});

app.use(keycloak.middleware());

app.use(bodyParser.json());
app.use(
  session({
    secret: "Acxx5vgEB3BOf86t9u6Yu9roMSWAteKe",
    resave: false,
    saveUninitialized: false,
  })
);

// PostgreSQL
const pool = new Pool({
  user: "whiteboarduser",
  host: "localhost",
  database: "whiteboarddb",
  password: "password",
  port: 5432,
});

// custom middleware for postgres
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.use("/secure-route", keycloak.protect(), (req, res) => {
  res.json({ message: "This route is secure!" });
});

app.post("/login", keycloak.protect(), (req, res) => {
  const { username } = req.kauth.grant.access.token.content;

  req.session.authenticated = true;
  req.session.username = username;

  res.redirect("/home");
});

app.post("/register", async (req, res) => {
  try {
    const keycloakAdminUrl =
      "http://localhost:8080/auth/admin/realms/WhiteboardRealm/users";
    const adminToken = await keycloak.grantManager.obtainDirectly();

    const keycloakResponse = await axios.post(
      keycloakAdminUrl,
      {
        username: req.body.username,
        enabled: true,
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken.access_token}`,
          "Content-type": "application/json",
        },
      }
    );

    if (keycloakResponse.status !== 201) {
      throw new Error("Keycloak registration failed");
    }

    const client = await req.pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO users (username) VALUES ($1)",
        [req.body.username]
      );
      console.log("User inserted into Postgre database:", result.rows[0]);
    } finally {
      client.release();
    }

    console.log("User registered successfully: ", keycloakResponse.data);
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(
      "Error during registration: ",
      error.resposne?.data || error.message
    );
    res
      .status(error.resposne?.status || 500)
      .json({ error: "registration failed" });
  }
});

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// cursor movement
io.on("connection", (socket) => {
  const roomId = socket.handshake.query.roomId;
  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("draw", (data) => {
    io.to(roomId).emit("draw", data);
  });

  socket.on("cursorMove", (cursorPosition) => {
    io.to(roomId).emit("cursorMove", {
      id: socket.id,
      position: cursorPosition,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    socket.leave(roomId);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
