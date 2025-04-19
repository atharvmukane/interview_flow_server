import { Response, Request, NextFunction } from "express";
import { OpenAI } from "openai";
import fs from "fs";
import pdfParse from "pdf-parse";
import { InterviewModel } from "./interview.model";
import path from "path";
import FormData from "form-data";
// Removing busboy import since we're using express-fileupload
import { uploadToS3Bucket } from "../utils/generic/fileUpload";

import axios from "axios";
import { transcribeAudio } from "../utils/transcription";

// Initialize the OpenAI client for interview question generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parses raw text from OpenAI response to extract numbered questions
 *
 * @param rawText - The response text from OpenAI containing numbered questions
 * @returns Array of extracted questions with formatting cleaned up
 */
export function parseNumberedQuestions(rawText: string): string[] {
  const cleaned = rawText
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\n\s*\n/g, "\n") // Replace multiple line breaks with single line break
    .trim();

  // Extract questions by splitting on numbered pattern (e.g., "1. ", "2. ")
  const questionList = cleaned
    .split(/\n?\d+\.\s+/) // Split on digit followed by period and space
    .filter((q) => q.trim().length > 0) // Remove empty entries
    .map((q) => q.trim()); // Clean up whitespace

  return questionList;
}

/**
 * Controller for adding a new interview
 *
 * Handles:
 * 1. Resume file upload and processing
 * 2. Extraction of text from PDF resume
 * 3. Generation of personalized interview questions using OpenAI
 * 4. Creation of interview record in the database
 */
export const addInterview = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // Check if resume file exists in the request
    if (!req.files || !req.files["resume"]) {
      return res.status(400).json({
        message: "Resume file is required",
        success: false,
      });
    }

    const resumeFile = req.files["resume"];

    // Validate file type - currently only supporting PDF format
    const fileExtension = path.extname(resumeFile.name).toLowerCase();
    if (fileExtension !== ".pdf") {
      return res.status(400).json({
        message: "Only PDF files are supported for resumes",
        success: false,
      });
    }

    // Extract interview details from request body
    let {
      date,
      user,
      jobTitle,
      company,
      jobDescription,
      industry,
      skills,
      sessionId = "",
    } = req.body;

    // Validate required fields
    if (!date || !user || !jobTitle || !company || !industry) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // Parse skills JSON - this allows for structured skill data
    try {
      skills = JSON.parse(skills);
    } catch (e) {
      return res.status(400).json({
        message: "Invalid skills format",
        success: false,
      });
    }

    date = new Date(date);

    // Process resume file
    let resumeText = "";
    let resumeFilePath = "";

    try {
      // Extract text content from the PDF resume
      const parsed = await pdfParse(resumeFile.data);
      resumeText = parsed.text
        .replace(/\u0000/g, "") // Remove NULL chars
        .replace(/\n{2,}/g, "\n") // Collapse multiple line breaks
        .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
        .trim();

      // Generate unique filename to prevent collisions
      const fileName = `resume_${Date.now()}_${resumeFile.name}`;

      // Save the resume file to the uploads directory
      const uploadDir = path.join(__dirname, "../../public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      resumeFilePath = path.join(uploadDir, fileName);
      await fs.promises.writeFile(resumeFilePath, resumeFile.data);

      // S3 upload option (currently commented out)
      // const s3Upload = await uploadToS3Bucket(fileName, resumeFile.data);
      // resumeFilePath = (s3Upload as any).Location;
    } catch (error) {
      console.error("Error processing resume file:", error);
      return res.status(400).json({
        message: "Failed to process resume file",
        success: false,
        error,
      });
    }

    // Validate extracted resume text
    if (!resumeText || resumeText.length < 10) {
      return res.status(400).json({
        message: "Resume content too short or could not be extracted",
        success: false,
      });
    }

    // Craft prompt for OpenAI to generate personalized interview questions
    const prompt = `
Based on the following information, generate 5 personalized interview questions:

Resume: ${resumeText}
Job Title: ${jobTitle}
Company: ${company}
Industry: ${industry}
Job Description: ${jobDescription}
Skills: ${skills}

The questions should be relevant to the job title and challenge the candidate's experience.
`;

    // Send prompt to OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert technical interviewer." },
        { role: "user", content: prompt },
      ],
    });

    const responseText = completion.choices[0].message?.content;

    // Parse the generated questions into a structured format
    const questionsList = parseNumberedQuestions(responseText!);
    let interviewData: any = [];
    questionsList.forEach((question, index) => {
      interviewData.push({
        index: index,
        question: question,
        answer: "", // Empty initially, will be filled during interview
        analaysis: {}, // Will be filled after interview analysis
      });
    });

    if (!responseText) {
      return res.status(200).json({
        message: "Failed to schedule interview",
        success: false,
      });
    }

    console.log(responseText);

    // Create interview record in database
    const interview = await InterviewModel.create({
      date: date,
      jobTitle,
      company,
      jobDescription,
      industry,
      skills,
      user,
      interviewQAA: interviewData,
      resumeFilePath: resumeFilePath,
      resumeText: resumeText,
    });

    return res.status(200).json({
      message: "responseReceived",
      success: interview != null,
      result: interview,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      message: "failedToGetResponse",
      success: false,
      error: e,
    });
  }
};

export const getInterviews = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let { user } = req.body;

    const interviews = await InterviewModel.find({
      user: user,
      date: { $gte: new Date() },
    }).sort({ date: 1 });

    return res.status(200).json({
      message: "responseReceived",
      success: interviews != null,
      result: interviews,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      message: "Failed to get scheduled interviews",
      success: false,
      error: e,
    });
  }
};

export const saveRecording = async (req: Request, res: Response) => {
  const response = await uploadAndTranscribe(req, res);
  if (response["success"]) {
    return res.status(200).json(response);
  }
  return res.status(400).json({
    error: "Failed to upload audio file",
    message: "Failed to record response. Please try again",
  });
};

export const uploadAndTranscribe = async (
  req: Request,
  res: Response
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      if (!req.files) {
        return reject({
          success: false,
          error: "No files were uploaded",
        });
      }

      const uploadDir = path.join(__dirname, "../../public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Get the uploaded audio file (assuming it's the first file or named 'audio')
      const audioFile = req.files.audio || Object.values(req.files)[0];

      if (!audioFile) {
        return reject({
          success: false,
          error: "No audio file found in the request",
        });
      }

      // Check if audioFile is an array and use the first item if it is
      const file = Array.isArray(audioFile) ? audioFile[0] : audioFile;

      // Generate a unique filename
      const fileName = `${Date.now()}-${file.name}`;
      const saveFilePath = path.join(uploadDir, fileName);

      // Save the file
      file.mv(saveFilePath, async (err: any) => {
        if (err) {
          return reject({
            success: false,
            error: "Failed to save the audio file",
            details: err.message,
          });
        }

        try {
          const transcription = await transcribeAudio(saveFilePath);
          resolve({
            success: true,
            message: "Audio uploaded and transcribed successfully",
            result: transcription,
          });
        } catch (transcriptionError: any) {
          reject({
            success: false,
            error: "File uploaded but transcription failed",
            message: transcriptionError.message,
          });
        } finally {
          // Optionally clean up the file after processing
          if (fs.existsSync(saveFilePath)) {
            fs.unlinkSync(saveFilePath);
          }
        }
      });
    } catch (error) {
      reject({
        success: false,
        error: "Failed to upload audio file",
      });
    }
  });
};
