import express from "express";
import path from "path";
import fs from "fs";
import {
  uploadAudio,
  transcribe,
  uploadAndTranscribe,
} from "../controllers/transcriptionController";
import { config } from "../config/env";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
// api/transcription/upload
router.post("/upload", uploadAudio);

// api/transcription/transcribe
router.post("/transcribe", transcribe);

// api/transcription/transcribe-uploads
router.post("/transcribe-uploads", uploadAndTranscribe);

export default router;
