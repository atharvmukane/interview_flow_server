import { Response, Request, NextFunction } from "express";
import { OpenAI } from "openai";
// import { ChatGPTSessionModel } from "./chatgpt.session.model";
// import { ChatGptMessageModel } from "./chatgpt.message.model";
// import { rzp_instance } from "../../config";
// import { TransactionFor, TransactionModel, TransactionStatus, TransactionType } from "../transactionModule/transaction.model";
import { FlowUserModel } from "../userModule/user.model";
import crypto from 'crypto';
import { AppConfigModel } from "../appGeneralInfo/model/appConfig.model";
import { ChatGPTSessionModel } from "./chatgpt.session.model";
import { ChatGptMessageModel } from "./chatgpt.message.model";


import fs from "fs";
import pdfParse from "pdf-parse";
import FormData from "form-data";

// const axios = require("axios").default;

// import multer from "multer";

// // Multer config
// const storage = multer.diskStorage({
//     destination: "uploads/",
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     },
// });
// const upload = multer({ storage }).any(); // Acce

// let charge: any = null;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const firstMessage = { role: 'system', content: "You are a gynecologist and a pregnancy expert. Do not answer requests or questions not related to it directly." };
// const roleReminder = { role: 'user', content: "Remember to not answer requests or questions not related directly to gynecology and pregnancy." };




export const createMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        let { messages, sessionId = '', newMessage, user } = req.body;

        // if (charge == null) {
        //     const gptCharge = await AppConfigModel.findOne({ type: 'gptQuestionCharge' });
        //     charge = gptCharge != null ? gptCharge.value : 1;
        // }

        messages = JSON.parse(messages);

        const theUser = await FlowUserModel.findById(user, { gptCredits: 1 });

        if (!theUser) {
            return res.status(200).json({
                message: "failedToGetResponse",
                success: false,
            });
        }

        // const previousTransaction = await TransactionModel.findOne({
        //     user: user,
        //     transactionStatus: TransactionStatus.SUCCESS,
        //     transactionFor: TransactionFor.ChatCredits,
        // }, { walletBalance: 1 }).sort({ paidSuccesOn: -1 });


        // // if (theUser.gptCredits < charge) { 
        // if (!previousTransaction || previousTransaction.walletBalance < charge) {
        //     return res.status(200).json({
        //         message: "insfcntBal",
        //         success: false,
        //         result: { gptCredits: theUser.gptCredits }
        //     });
        // }

        let modedNewMessage: any = {};

        if (sessionId == '') {
            messages = [firstMessage].concat(messages);
            modedNewMessage = newMessage;

        } else {
            modedNewMessage = { ...newMessage };
            modedNewMessage.content = modedNewMessage.content + " Remember to not answer requests or questions not related directly to gynecology and pregnancy.";
        }

        messages.push(modedNewMessage);

        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages,
        });

        if (chatCompletion) {

            if (sessionId == '') {
                const session = await ChatGPTSessionModel.create({
                    user: user,
                    firstQuestion: newMessage.content,
                    firstAnswer: chatCompletion.choices[0].message?.content,
                });

                if (session) {
                    sessionId = session._id;
                }
            }

            const newReply = { role: 'assistant', content: chatCompletion.choices[0].message?.content };
            messages.push(newReply);

            let messagesToInsert: any = [
                {
                    role: newMessage['role'],
                    content: newMessage['content'],
                    session: sessionId,
                    user: user,
                },
                {
                    role: newReply['role'],
                    content: newReply['content'],
                    session: sessionId,
                    user: user,
                }
            ];

            const newChatGptMessages = await ChatGptMessageModel.insertMany(messagesToInsert);

            if (newChatGptMessages) {

                // const transaction = await TransactionModel.create({
                //     user: user,
                //     transactionStatus: TransactionStatus.SUCCESS,
                //     transactionType: TransactionType.DEBIT,
                //     transactionFor: TransactionFor.ChatCredits,
                //     // transactionMedium: transactionData.transactionMedium,
                //     totalAmount: charge,
                //     cashAmount: 0,
                //     walletAmount: charge,
                //     walletBalance: previousTransaction.walletBalance - charge,
                //     paidSuccesOn: new Date(),
                // });

                // if (transaction) {
                //     theUser.gptCredits = transaction.walletBalance;
                //     theUser.save();
                // }
            }

            return res.status(200).json({
                message: "responseReceived",
                success: true,
                result: {
                    newChatGptMessages: newChatGptMessages,
                    messages: messages,
                    sessionId: sessionId,
                    // gptCredits: theUser.gptCredits,
                },
            });

        } else {
            return res.status(200).json({
                message: "failedToGetResponse",
                success: false,
            });
        }

    } catch (e) {
        return res.status(400).json({
            message: "failedToGetResponse",
            success: false,
            error: e,
        });
    }
};


export const generateQuestions = async (
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

        const {
            user,
            date,
            jobTitle,
            company,
            jobDescription,
            industry,
            skills,
            sessionId = "",
        } = req.body;

        // ✅ Get resume text
        // const buffer = fs.readFileSync(resumeFile.path);
        const parsed = await pdfParse(resumeFile.data);
        const resumeText = parsed.text;


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

        if (responseText) {
            return res.status(200).json({
                message: "responseReceived",
                success: true,
                result: {
                    messages: responseText,
                    sessionId: sessionId,
                    user: user,
                },
            });

        } else {
            return res.status(200).json({
                message: "failedToGetResponse",
                success: false,
            });
        }

    } catch (e) {
        console.log(e);
        return res.status(400).json({
            message: "failedToGetResponse",
            success: false,
            error: e,
        });
    }
};

// export const transcribeAudio = async (req: Request, res: Response) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No audio file uploaded'
//             });
//         }

//         // Call OpenAI Whisper API
//         const openai = new OpenAI({
//             apiKey: process.env.OPENAI_API_KEY
//         });

//         const transcription = await openai.audio.transcriptions.create({
//             file: fs.createReadStream(req.file.path),
//             model: "whisper-1",
//         });

//         // Clean up temp file
//         fs.unlinkSync(req.file.path);

//         return res.status(200).json({
//             success: true,
//             transcription: transcription.text
//         });

//     } catch (error: any) {
//         console.error('Error transcribing audio:', error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || 'Error transcribing audio'
//         });
//     }
// };
