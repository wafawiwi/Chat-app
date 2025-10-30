import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// === CONNECT TO MONGODB ===
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// === SIMPLE ROUTE ===
app.get("/", (req, res) => {
  res.send("🌍 Server is running!");
});

// === SOCKET.IO EVENTS (for live chat later) ===
io.on("connection", (socket) => {
  console.log("👤 New user connected:", socket.id);

  socket.on("sendMessage", (msg) => {
    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));