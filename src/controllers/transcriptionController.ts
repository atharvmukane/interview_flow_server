import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import busboy from "busboy";
import { transcribeAudio } from "./../utils/transcription";

export const uploadAudio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      res
        .status(400)
        .json({ error: "Content type must be multipart/form-data" });
      return;
    }

    const uploadDir = path.join(__dirname, "../../public/uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const bb = busboy({ headers: req.headers });
    let saveFilePath = "";
    let fileName = "";

    // Handle file upload
    bb.on("file", (name, file, info) => {
      const { filename, encoding, mimeType } = info;

      // Generate unique filename
      fileName = `${Date.now()}-${filename}`;
      saveFilePath = path.join(uploadDir, fileName);

      console.log(`Uploading: ${filename}, mime: ${mimeType}`);

      // Stream file to disk
      const writeStream = fs.createWriteStream(saveFilePath);
      file.pipe(writeStream);
    });

    // Handle completion
    bb.on("finish", () => {
      if (!saveFilePath) {
        res.status(400).json({ error: "No file was uploaded" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Audio uploaded successfully",
        file: {
          filename: fileName,
          path: saveFilePath,
        },
      });
    });

    bb.on("error", (err) => {
      console.error("Error processing form:", err);
      res.status(500).json({ error: "Failed to process file upload" });
    });

    // Pipe the request into busboy
    req.pipe(bb);
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};

export const transcribe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { filename } = req.body;

    if (!filename) {
      res.status(400).json({ error: "Filename is required" });
      return;
    }

    const filePath = path.join(__dirname, "../../public/uploads", filename);

    const transcription = await transcribeAudio(filePath);

    res.status(200).json({
      success: true,
      transcription,
    });
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    res.status(500).json({
      error: "Failed to transcribe audio",
      message: error.message,
    });
  }
};

export const uploadAndTranscribe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      res
        .status(400)
        .json({ error: "Content type must be multipart/form-data" });
      return;
    }

    const uploadDir = path.join(__dirname, "../../public/uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const bb = busboy({ headers: req.headers });
    let saveFilePath = "";
    let fileName = "";

    // Handle file upload
    bb.on("file", (name, file, info) => {
      const { filename, encoding, mimeType } = info;

      // Generate unique filename
      fileName = `${Date.now()}-${filename}`;
      saveFilePath = path.join(uploadDir, fileName);

      console.log(`Uploading: ${filename}, mime: ${mimeType}`);

      // Stream file to disk
      const writeStream = fs.createWriteStream(saveFilePath);
      file.pipe(writeStream);
    });

    // Handle completion - now with transcription
    bb.on("finish", async () => {
      if (!saveFilePath) {
        res.status(400).json({ error: "No file was uploaded" });
        return;
      }

      try {
        // Transcribe the audio file
        const transcription = await transcribeAudio(saveFilePath);

        res.status(200).json({
          success: true,
          message: "Audio uploaded and transcribed successfully",
          file: {
            filename: fileName,
            path: saveFilePath,
          },
          transcription,
        });
      } catch (transcriptionError: any) {
        console.error("Error transcribing audio:", transcriptionError);
        res.status(500).json({
          error: "File uploaded but transcription failed",
          message: transcriptionError.message,
        });
      }
    });

    bb.on("error", (err) => {
      console.error("Error processing form:", err);
      res.status(500).json({ error: "Failed to process file upload" });
    });

    // Pipe the request into busboy
    req.pipe(bb);
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};
