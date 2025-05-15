const { Server } = require("socket.io");

const onlineUsers = {};

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected");

    socket.on("addUser", (userId) => {
      socket.userId = userId;
      if (!onlineUsers[userId]) {
        onlineUsers[userId] = new Set();
      }
      onlineUsers[userId].add(socket.id);
      io.emit("updateUsers", getOnlineStatus());
    });

    socket.on("typing", ({ to }) => {
  const toSockets = onlineUsers[to];
  if (toSockets) {
    for (let sockId of toSockets) {
      io.to(sockId).emit("typing", { from: socket.userId });
    }
  }
});

socket.on("stopTyping", ({ to }) => {
  const toSockets = onlineUsers[to];
  if (toSockets) {
    for (let sockId of toSockets) {
      io.to(sockId).emit("stopTyping", { from: socket.userId });
    }
  }
});




    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
      const toSockets = onlineUsers[receiverId];
      if (toSockets) {
        for (let sockId of toSockets) {
          io.to(sockId).emit("getMessage", {
            senderId,
            text,
            createdAt: new Date()
          });
        }
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId && onlineUsers[socket.userId]) {
        onlineUsers[socket.userId].delete(socket.id);
        if (onlineUsers[socket.userId].size === 0) {
          delete onlineUsers[socket.userId];
        }
        io.emit("updateUsers", getOnlineStatus());
      }
    });
  });

  function getOnlineStatus() {
    const status = {};
    for (const userId in onlineUsers) {
      status[userId] = true;
    }
    return status;
  }
};
