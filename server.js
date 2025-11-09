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

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === STATIC FILES ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname)); // serve HTML, JS, CSS files

// === SEARCH ROUTE ===
app.use(findUsersRoute);

// === MONGODB CONNECTION ===
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// === SOCKET.IO EVENTS ===
io.on("connection", (socket) => {
  console.log("👤 New user connected:", socket.id);

  socket.on("sendMessage", (msg) => io.emit("receiveMessage", msg));

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});

// === USER MODEL ===
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// === SIGNUP ROUTE ===
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  const existingUser = await User.findOne({ username });
  if (existingUser)
    return res.status(400).json({ message: "Username already taken" });

  await User.create({ username, password });
  res.json({ message: "Signup successful" });
});

// === LOGIN ROUTE ===
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "User not found" });
  if (user.password !== password) return res.status(400).json({ message: "Wrong password" });

  res.json({ message: "Login successful" });
});

// === ROOT ROUTE REDIRECT ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "find-friends.html")); // show your search page by default
});

// === FRIENDS MODEL ===
const friendSchema = new mongoose.Schema({
  user: String,       // who is adding
  friend: String      // who they added
});
const Friend = mongoose.models.Friend || mongoose.model("Friend", friendSchema);

// === ADD FRIEND ROUTE ===
app.post("/api/friends/add", async (req, res) => {
  try {
    const { user, friend } = req.body;

    if (!user || !friend) {
      return res.status(400).json({ error: "Missing user or friend" });
    }

    // prevent duplicates
    const exists = await Friend.findOne({ user, friend });
    if (exists) return res.json({ message: "Already added!" });

    const newFriend = new Friend({ user, friend });
    await newFriend.save();

    res.json({ message: "Friend added!" });
  } catch (err) {
    console.error("Error adding friend:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
