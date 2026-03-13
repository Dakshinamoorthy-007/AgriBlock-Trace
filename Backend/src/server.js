import "dotenv/config"; // ← this single line loads .env automatically, no .config() needed
import dns from "dns";
import connectDB from "./config/db.js";
import app from "./app.js";

// DNS fix for Mongo Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;

console.log("🔍 Connecting to MongoDB...");
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});