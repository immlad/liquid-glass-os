const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static frontend (put index.html, tailwind.css, app.js in /public)
app.use(express.static(path.join(__dirname, "public")));

const formatMessage = (username, text) => {
  return {
    username,
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    if (!room) room = "general";
    socket.join(room);
    socket.data.username = username || "Guest";
    socket.data.room = room;

    socket.emit("message", formatMessage("System", `Welcome to #${room}`));
    socket.broadcast
      .to(room)
      .emit("message", formatMessage("System", `${socket.data.username} joined #${room}`));

    io.to(room).emit("roomUsers", { room });
  });

  socket.on("chatMessage", (msg) => {
    const room = socket.data.room || "general";
    const username = socket.data.username || "Guest";
    io.to(room).emit("message", formatMessage(username, msg));
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    const username = socket.data.username;
    if (room && username) {
      socket.broadcast
        .to(room)
        .emit("message", formatMessage("System", `${username} left #${room}`));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Liquid Glass OS server running on port ${PORT}`);
});
