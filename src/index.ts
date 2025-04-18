import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config/env";
import transcriptionRoutes from "./routes/transcriptionRoutes";

const app = express();

// Middleware
app.use(cors());
// Increase JSON payload size limit for base64 encoded audio (100MB)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Serve static files from public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api/transcription", transcriptionRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Audio Transcription API is running");
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/`);
});
