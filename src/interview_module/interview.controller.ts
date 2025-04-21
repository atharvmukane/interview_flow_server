import { Response, Request, NextFunction } from "express";
import { OpenAI } from "openai";
import fs from "fs";
import pdfParse from "pdf-parse";
import { InterviewModel, InterviewStatus } from "./interview.model";
import path from "path";
import FormData from "form-data";
// Removing busboy import since we're using express-fileupload
import { uploadToS3Bucket } from "../utils/generic/fileUpload";

import axios from "axios";
import { transcribeAudio } from "../utils/transcription";
import { generateQaHistory, isJunk } from "../utils/middleware/commonFunction";

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
        // try {
        //     skills = JSON.parse(skills);
        // } catch (e) {
        //     return res.status(400).json({
        //         message: "Invalid skills format",
        //         success: false,
        //     });
        // }

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
        You are a technical interviewer. Based on the details below, generate 5 personalized interview questions for the candidate.
        
        Rules:
        - Only 1 or 2 questions should refer to the resume content below (e.g., past experience or projects).
        - The remaining 3 or 4 questions must be technical, based on the job title, job description, and the provided skills.
        - The goal is to assess the candidate's ability to perform in the specified role, using domain-specific and technical questions.
        - Do not overfocus on resume. Prioritize job description, title, and skills when forming the majority of the questions.
        
        Candidate Resume:
        ${resumeText}
        
        Job Title: ${jobTitle}
        Company: ${company}
        Industry: ${industry}
        Job Description: ${jobDescription}
        Candidate's Skills: ${skills}
        
        Provide only the list of 5 questions without additional commentary or introduction.
        `;

        // Send prompt to OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
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
        let { status } = req.query;

        const filters: any = { date: {} };
        filters.interviewStatus = status;

        if (status == InterviewStatus.Completed) {
            delete filters.date;
        } else {
            filters.date = { $gte: new Date() };
        }

        const interviews = await InterviewModel.find({
            user: user,
            ...filters,
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



export async function getResponseAnalysisFromChatGPT(data: any): Promise<any> {
    const { transcript, jobTitle, interviewQuestion, duration, interviewId, questionIndex } = data;

    if (!transcript || !jobTitle || !interviewQuestion || !duration) {
        return {
            success: false,
            error: 'Missing required fields.',
            message: 'Failed to analyze response. Please provide all necessary data.',
        };
    }

    let prompt = `[Session ID: ${interviewId}]

    `;

    if (questionIndex == 0) {

        prompt = prompt + `

  You are an expert technical interviewer. Analyze the following candidate's answer for the job role of "${jobTitle}".

  Speak directly to the user, as if you're giving them feedback about their own performance. Use "you" instead of "the candidate". Keep the tone constructive, helpful, and clear.

  There will be multiple questions ahead. Starting now:
  
  `
    }

    prompt = prompt + `
    
    Question:
  "${interviewQuestion}"
  
  User's Answer:
  "${transcript}"
  
  Duration of Answer: ${duration} (in mm:ss)
  
  Return your response strictly in this JSON format:
  
  {
    "tone_and_confidence": "Your analysis here",
    "strengths": ["First strength", "Second strength"],
    "improvements": ["First improvement", "Second improvement"],
    "follow_up_question": "A meaningful follow-up question based on the answer",
    "answer_success": "Summarize overall success in 1-3 words. Example terms: 'Needs more preparation', 'Adequate', 'Clear and concise', 'Excellent and impactful', etc. You may create your own phrase.",
    "answer_success_suggestion": "Explain why this success rating was given.",
    "rating": A number between 1 (poor) and 10 (excellent) based on the overall quality of the answer,
    "tags": [
    { "label": "Relevant", "color": "green" },
    { "label": "Vague", "color": "red" },
    // { "label": "Confident", "color": "green" }
    ]
  }

Provide 2-3 tags — not necessarily 3. Do not give contradictory labels. Each tag should be a 1-2 word phrase summarizing a key observation about the answer. Use any meaningful terms that best fit the response (e.g., “Over-generalized”, “Well-structured”, “Too brief”, etc.). Assign one of the following color labels to each tag:
- "green" for positive observations
- "yellow" for neutral/mixed observations
- "red" for negative/problematic observations

  Only return valid JSON. Do not include any explanation or extra text outside the JSON.
  `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const gptOutput = response.data.choices[0].message.content;

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(gptOutput);
        } catch (e) {
            return {
                success: false,
                error: 'Failed to parse GPT response.',
                message: 'Analysis failed due to JSON parsing error. Please try again.',
            };
        }

        return {
            success: true,
            result: parsedOutput,
            message: 'Analysis successful',
        };

    } catch (error: any) {
        console.error('OpenAI API error:', error.message);
        return {
            success: false,
            error: error.message,
            message: 'Failed to analyze response. Please try again.',
        };
    }
}

export const saveRecording = async (req: Request, res: Response) => {

    let { interviewId, questionIndex, duration, totalDuration } = req.body;

    questionIndex = parseInt(questionIndex);

    const response = await uploadAndTranscribe(req, res);
    if (response["success"]) {

        if (isJunk(response["result"])) {
            response["result"] = "..";
        }

        const interview = await InterviewModel.findById(interviewId);
        if (!interview) {
            return res.status(400).json({
                error: "Interview not found",
                message: "Failed to record response. Please try again",
            });
        }

        interview.interviewQAA[questionIndex].answer = response["result"];
        interview.interviewQAA[questionIndex].duration = duration;
        interview.duration = totalDuration;

        // Optionally, you can delete the audio file after processing
        //  if (fs.existsSync(saveFilePath)) {
        //     fs.unlinkSync(saveFilePath);
        // }

        const analysisResponse = await getResponseAnalysisFromChatGPT({
            transcript: response["result"],
            jobTitle: interview.jobTitle,
            interviewQuestion: interview.interviewQAA[questionIndex].question,
            duration: duration,
            interviewId: interviewId,
            questionIndex: questionIndex,
        });

        if (analysisResponse['result']) {
            interview.interviewQAA[questionIndex].analaysis = analysisResponse['result'];
        }

        await interview.save();

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





export const endInterviewSession = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        let { user, interviewId, totalDuration } = req.body;

        const existInterview = await InterviewModel.findById(interviewId);

        let qaHistory;

        if (existInterview) {
            qaHistory = generateQaHistory(existInterview.interviewQAA);
        }

        const prompt = `
        You are an experienced technical interviewer reviewing an entire mock interview session.
        
        Below is a list of interview questions and the candidate's answers from session ID: ${interviewId}.
        
        Based on this overall performance:
        - Provide a single **evaluation term or short phrase** (e.g., "Exceptional", "Can improve", "Average", "High potential").
        - Also provide a **numeric rating out of 10** (e.g., 7.0, 8.5, 9.2), based on the candidate’s rating for each answer provided
        - Do NOT repeat the questions or answers.
        - Return the response in **strict JSON format** only.
        
        Here is the interview session:
        
        ${qaHistory}
        
        Expected JSON format:
        {
          "evaluation": "[Your term here]",
          "rating": [Your numeric rating here]
        }
        `;
        // - Also provide a **numeric rating out of 10** (e.g., 7.0, 8.5, 9.2), based on the candidate’s rating for each answer provided
        // - Also provide a **numeric rating out of 10** (e.g., 7.0, 8.5, 9.2), based on the candidate’s clarity, technical depth, relevance, communication, and fit for the role.

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const gptOutput = response.data.choices[0].message.content;

        const parseData = JSON.parse(gptOutput);

        const interview = await InterviewModel.findByIdAndUpdate(interviewId, {
            interviewStatus: InterviewStatus.Completed,
            duration: totalDuration,
            rating: parseData['rating'],
            overallSuccess: parseData['evaluation'],
        });


        return res.status(200).json({
            message: "Interview closed successfully",
            success: interview != null,
            result: interview,
        });

    } catch (e) {
        console.log(e);
        return res.status(400).json({
            message: "Failed to close interview",
            success: false,
            error: e,
        });
    }
};


