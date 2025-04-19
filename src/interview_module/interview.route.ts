import { verifyJwtToken } from "./../utils/middleware/verify-jwt-token";
import {
    addInterview, getInterviews,
    saveRecording,
    //  saveRecording
} from "./interview.controller";

const express = require("express");
export const InterviewRouter = express.Router();

// api/interview/addInterview
InterviewRouter.post("/addInterview", addInterview);

// api/interview/getInterviews
InterviewRouter.get("/getInterviews", verifyJwtToken, getInterviews);

// api/interview/saveRecording
InterviewRouter.post("/saveRecording", saveRecording);


// // api/transcription/saveRecording
// InterviewRouter.post("/saveRecording", saveRecording);