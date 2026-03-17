import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import traceRoutes from "./routes/trace.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const allowedOrigins = [
  "https://agri-block-trace.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // this already covers preflight — no app.options() needed

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "AgriChain backend running" });
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trace", traceRoutes);
app.use("/api/batch", batchRoutes);

export default app;