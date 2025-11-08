import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

// connect to MongoDB
mongoose.connect("mongodb+srv://diva_admin:Wafa_182006@backend.rxsphj0.mongodb.net/?retryWrites=true&w=majority&appName=backend")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Failed to connect:", err));

// simple test route
app.get("/", (req, res) => {
  res.send("Diva backend is alive 💅✨");
});

// start server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
