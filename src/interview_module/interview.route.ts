import { verifyJwtToken } from "./../utils/middleware/verify-jwt-token";
import {
    addInterview, endInterviewSession, generateAnswerPrompt, getInterviews,
    saveRecording,
    //  saveRecording
} from "./interview.controller";
import { runPythonScript } from "./utils/pythonRunner";

const express = require("express");
export const InterviewRouter = express.Router();

// api/interview/addInterview
InterviewRouter.post("/addInterview", addInterview);

// api/interview/getInterviews
InterviewRouter.get("/getInterviews", verifyJwtToken, getInterviews);

// api/interview/saveRecording
InterviewRouter.post("/saveRecording", saveRecording);

// api/interview/endInterviewSession
InterviewRouter.put("/endInterviewSession", endInterviewSession);

// api/interview/generateAnswerPrompt
InterviewRouter.post("/generateAnswerPrompt", generateAnswerPrompt);


// // api/transcription/saveRecording
// InterviewRouter.post("/saveRecording", saveRecording);

InterviewRouter.post('/nlpGenerateQuestion', async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const result = await runPythonScript(payload);

        console.log(result);
        // res.status(200).json({ success: true, questions: result.questions });
    } catch (err) {
        console.log(err);
        // res.status(500).json({ success: false, error: err.message });
    }
});