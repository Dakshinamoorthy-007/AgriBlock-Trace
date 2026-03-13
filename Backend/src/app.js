import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import traceRoutes from "./routes/trace.routes.js";
import adminRoutes from "./routes/admin.routes.js";


const app = express();
app.get("/", (req, res) => {
  res.json({ status: "AgriChain backend running" });
});
// 🔥 GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());


// 🔥 ROUTES
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trace", traceRoutes);
app.use("/api/batch", batchRoutes);


export default app;
