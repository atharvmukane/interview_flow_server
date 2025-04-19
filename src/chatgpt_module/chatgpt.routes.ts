import { createMessage, generateQuestions } from "./chatgpt.controller";
// import { uploadAudio } from "../middlewares/multer.middleware";

const express = require("express");
export const ChatGPTRouter = express.Router();

// api/chatgpt/createMessage
ChatGPTRouter.post("/createMessage", createMessage);

// api/chatgpt/generateQuestions
ChatGPTRouter.post("/generateQuestions", generateQuestions);

// // api/chatgpt/transcribe
// ChatGPTRouter.post("/transcribe", uploadAudio.single('audio'), transcribeAudio);
