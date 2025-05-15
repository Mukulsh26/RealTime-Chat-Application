const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("MongoDB connected");
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

connectDB();

require("./socket")(server);

server.listen(process.env.PORT || 5000, () => {
  console.log("Server started on port 5000");
});
