import { Request, Response } from "express";
import path from "path";
import fs from "fs";
// Using express-fileupload instead of busboy for file handling
import { transcribeAudio } from "./../utils/transcription";
import { UploadedFile } from "express-fileupload";

/**
 * Handles audio file uploads
 * 
 * This endpoint allows users to upload audio files to the server.
 * Files are saved to the uploads directory with a timestamp-prefixed name
 * to prevent filename collisions.
 */
export const uploadAudio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate that files were included in the request
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ error: "No files were uploaded" });
      return;
    }

    const uploadDir = path.join(__dirname, "../../public/uploads");

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Get the uploaded file (either by field name or first file)
    const audioFile: any = req.files.audio || Object.values(req.files)[0] as UploadedFile;

    // Generate unique filename using timestamp
    const fileName = `${Date.now()}-${audioFile.name}`;
    const saveFilePath = path.join(uploadDir, fileName);

    console.log(`Uploading: ${audioFile.name}, mime: ${audioFile.mimetype}`);

    // Move the file to the upload directory using express-fileupload
    audioFile.mv(saveFilePath, (err: any) => {
      if (err) {
        console.error("Error saving file:", err);
        res.status(500).json({ error: "Failed to save the uploaded file" });
        return;
      }

      // Return success with file information
      res.status(200).json({
        success: true,
        message: "Audio uploaded successfully",
        file: {
          filename: fileName,
          path: saveFilePath,
        },
      });
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};

/**
 * Transcribes an already uploaded audio file
 * 
 * Expects the filename of a previously uploaded file. 
 * The transcription is performed using the external transcribeAudio utility.
 */
export const transcribe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { filename } = req.body;

    // Validate input
    if (!filename) {
      res.status(400).json({ error: "Filename is required" });
      return;
    }

    // Construct the full path to the file
    const filePath = path.join(__dirname, "../../public/uploads", filename);

    // Perform transcription
    const transcription = await transcribeAudio(filePath);

    // Return transcription result
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

/**
 * Combined endpoint that handles both file upload and transcription in one step
 * 
 * This is a convenience endpoint that:
 * 1. Receives an audio file upload
 * 2. Saves it to the uploads directory
 * 3. Immediately transcribes the audio
 * 4. Returns both file information and transcription results
 */
export const uploadAndTranscribe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate that files were included in the request
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ error: "No files were uploaded" });
      return;
    }

    const uploadDir = path.join(__dirname, "../../public/uploads");

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Get the uploaded file (either by field name or first file)
    const audioFile: any = req.files.audio || Object.values(req.files)[0] as UploadedFile;

    // Generate unique filename using timestamp
    const fileName = `${Date.now()}-${audioFile.name}`;
    const saveFilePath = path.join(uploadDir, fileName);

    console.log(`Uploading: ${audioFile.name}, mime: ${audioFile.mimetype}`);

    // Move the file to the upload directory using express-fileupload
    audioFile.mv(saveFilePath, async (err: any) => {
      if (err) {
        console.error("Error saving file:", err);
        res.status(500).json({ error: "Failed to save the uploaded file" });
        return;
      }

      try {
        // Transcribe the audio file immediately after upload
        const transcription = await transcribeAudio(saveFilePath);

        // Return both file info and transcription results
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
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};
