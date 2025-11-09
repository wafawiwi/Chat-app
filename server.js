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

// === FILE PATH SETUP ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === SERVE FRONTEND FILES ===
// This makes your find-friends.html open properly when you go to your Render URL
app.use(express.static(__dirname));

// === ROUTES ===
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

// === FRIEND MODEL ===
const friendSchema = new mongoose.Schema({
  user: String,   // who adds
  friend: String  // who is added
});
const Friend = mongoose.models.Friend || mongoose.model("Friend", friendSchema);

// GET list of friends for a user
// Example: /api/friends/list?user=wafa
app.get("/api/friends/list", async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).json([]);
  
  try {
    const friends = await Friend.find({ user }).select("friend -_id");
    res.json(friends.map(f => f.friend)); // return array of usernames
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

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

// === ADD FRIEND ROUTE ===
app.post("/api/friends/add", async (req, res) => {
  try {
    const { user, friend } = req.body;
    console.log("📩 Add Friend request:", user, "→", friend);

    if (!user || !friend) {
      return res.status(400).json({ error: "Missing user or friend" });
    }

    // avoid duplicates
    const existing = await Friend.findOne({ user, friend });
    if (existing) return res.json({ message: "Already added!" });

    const newFriend = new Friend({ user, friend });
    await newFriend.save();
    console.log("✅ Friend saved:", newFriend);

    res.json({ message: "Friend added!" });
  } catch (err) {
    console.error("❌ Error adding friend:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === DEFAULT PAGE ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "find-friends.html"));
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
