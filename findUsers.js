import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// use same User model from main server
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// === SEARCH ROUTE ===
router.get("/api/users/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const users = await User.find({
      username: { $regex: q, $options: "i" },
    }).limit(10);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
