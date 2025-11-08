import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import findUsersRoute from "./findUsers.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// === SERVE STATIC FILES ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname)); // now search.html will be served from the server

// === ROUTES ===
app.use(findUsersRoute);

// === MONGODB ===
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// === OTHER ROUTES ===
app.get("/", (req, res) => res.send("🌍 Server is running!"));

io.on("connection", (socket) => {
  console.log("👤 New user connected:", socket.id);

  socket.on("sendMessage", (msg) => io.emit("receiveMessage", msg));

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});

// USER MODEL
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// SIGNUP / LOGIN ROUTES (unchanged)
// ...

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
