import { Response, Request, NextFunction } from "express";
import { OpenAI } from "openai";
import fs from "fs";
import pdfParse from "pdf-parse";
import { InterviewModel } from "./interview.model";
import path from 'path';
import FormData from 'form-data';
import busboy from "busboy";


// const axios = require("axios").default;

import axios from 'axios';
import { transcribeAudio } from "../utils/transcription";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export function parseNumberedQuestions(rawText: string): string[] {
    // Step 1: Normalize newlines and trim spaces
    const cleaned = rawText
        .replace(/\r/g, "")        // remove carriage returns
        .replace(/\n\s*\n/g, "\n") // remove extra blank lines
        .trim();

    // Step 2: Use regex to split based on "1. ", "2. ", etc.
    const questionList = cleaned
        .split(/\n?\d+\.\s+/)      // split at numbers like 1. 2. 3.
        .filter(q => q.trim().length > 0) // remove empty entries
        .map(q => q.trim());       // trim each question

    return questionList;
}


export const addInterview = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {

        console.log("BODY:", req.body);       // ✅ Should now be present
        console.log("FILES:", req.files);     // ✅ Should now be present

        const resumeFile = req.files['resume'];

        if (!resumeFile) {
            return res.status(400).json({
                message: "Resume file missing",
                success: false,
            });
        }


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

        skills = JSON.parse(skills);
        date = new Date(date);

        // ✅ Get resume text
        // const buffer = fs.readFileSync(resumeFile.path);
        const parsed = await pdfParse(resumeFile.data);
        const resumeText = parsed.text
            .replace(/\u0000/g, "")                      // Remove NULL chars
            .replace(/\n{2,}/g, "\n")                    // Collapse multiple line breaks
            .replace(/[^\x00-\x7F]/g, "")                // (Optional) Remove non-ASCII characters
            .trim();


        // Compose prompt
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

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert technical interviewer." },
                { role: "user", content: prompt },
            ],
        });

        const responseText = completion.choices[0].message?.content;

        const questionsList = parseNumberedQuestions(responseText!);
        let interviewData: any = [];
        questionsList.forEach((question, index) => {
            interviewData.push({
                index: index,
                question: question,
                answer: '',
                analaysis: {},
            });
        });

        if (!responseText) {
            return res.status(200).json({
                message: "Failed to schedule interview",
                success: false,
            });
        }

        console.log(responseText);

        const interview = await InterviewModel.create({
            date: date,
            jobTitle,
            company,
            jobDescription,
            industry,
            skills,
            user,
            interviewQAA: interviewData,
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
        })
            .sort({ date: 1 });

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



// export const saveRecording = async (req: Request, res: Response) => {
//     let audioPath: string | undefined;

//     try {
//         // Check if file exists in request
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No audio file uploaded'
//             });
//         }

//         audioPath = req.file.path;
//         console.log('Audio file stored at:', audioPath);

//         // Create form data for OpenAI API
//         const formData = new FormData();

//         // Add the file from disk
//         const fileStream = fs.createReadStream(audioPath);
//         formData.append('file', fileStream);
//         formData.append('model', 'whisper-1');

//         console.log('Sending file to Whisper API...');

//         // Call OpenAI API for transcription
//         const response = await axios.post(
//             'https://api.openai.com/v1/audio/transcriptions',
//             formData,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                     ...formData.getHeaders()
//                 },
//                 maxContentLength: Infinity,
//                 maxBodyLength: Infinity
//             }
//         );

//         // Store transcription result and return
//         const transcription = response.data.text;
//         console.log('Transcription received:', transcription.substring(0, 100) + '...');

//         return res.status(200).json({
//             success: true,
//             transcription,
//             audioPath
//         });

//     } catch (error: any) {
//         console.error('Error processing audio:', error);

//         // Determine the specific error message
//         let errorMessage = 'Failed to process audio file';
//         if (error.response?.data?.error) {
//             errorMessage = error.response.data.error.message;
//         } else if (error.message) {
//             errorMessage = error.message;
//         }

//         return res.status(500).json({
//             success: false,
//             message: errorMessage,
//             error: error?.response?.data || error.message
//         });

//     } finally {
//         // Clean up the audio file if it exists
//         if (audioPath && fs.existsSync(audioPath)) {
//             try {
//                 await fs.promises.unlink(audioPath);
//                 console.log('Temporary audio file deleted:', audioPath);
//             } catch (unlinkError) {
//                 console.error('Error deleting audio file:', unlinkError);
//             }
//         }
//     }
// };

export const saveRecording = async (
    req: Request,
    res: Response,) => {

    const response = await uploadAndTranscribe(req, res);
    if (response['success']) {
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
            if (!req.headers["content-type"]?.includes("multipart/form-data")) {
                return reject({
                    success: false,
                    error: "Content type must be multipart/form-data"
                });
            }

            const uploadDir = path.join(__dirname, "../../public/uploads");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const bb = busboy({ headers: req.headers });
            let saveFilePath = "";
            let fileName = "";

            bb.on("file", (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                fileName = `${Date.now()}-${filename}`;
                saveFilePath = path.join(uploadDir, fileName);

                const writeStream = fs.createWriteStream(saveFilePath);
                file.pipe(writeStream);
            });

            bb.on("finish", async () => {
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
                    // Cleanup
                    if (fs.existsSync(saveFilePath)) {
                        fs.unlinkSync(saveFilePath);
                    }
                }
            });

            bb.on("error", (err) => {
                reject({
                    success: false,
                    error: "Failed to process file upload"
                });
            });

            req.pipe(bb);

        } catch (error) {
            reject({
                success: false,
                error: "Failed to upload audio file"
            });
        }
    });
};