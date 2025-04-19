import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
import { FlowUser } from './../userModule/user.model';
// import { LoyaltyLevel } from '../loyaltyProgramModule/loyalty.model';

/**
 * Schema for interview questions, answers and analysis
 * 
 * Stores the structured data for each question in the interview,
 * including the AI-generated question, candidate's answer, and
 * any analysis of the response.
 */
class InterviewQAA {
    @prop()
    index: number;  // Order of the question in the interview

    @prop()
    question: string;  // The AI-generated interview question

    @prop()
    answer: string;  // Candidate's response (transcribed from audio)

    @prop()
    analaysis: {  // Analysis of the candidate's response
        [key: string]: any;
    };
}

/**
 * Interview model for storing interview sessions
 * 
 * Contains all details about an interview including:
 * - Job and company information
 * - Resume data and extracted text
 * - Generated interview questions
 * - Candidate's recorded responses
 */
export class Interview {
    readonly _id: ObjectId;  // Unique identifier for the interview

    readonly createdAt: Date;  // When the interview was created

    readonly updatedAt: Date;  // When the interview was last updated

    @prop({})
    company: string;  // Company name for the job position

    @prop({})
    industry: string;  // Industry sector for contextually relevant questions

    @prop({ ref: () => FlowUser })
    user: Ref<FlowUser>;  // User (candidate) taking the interview

    @prop()
    date: Date;  // Scheduled date for the interview

    @prop()
    jobTitle: string;  // Position the candidate is interviewing for

    @prop({})
    jobDescription: string;  // Detailed job description for context

    @prop()
    skills: string[];  // Required skills for the position

    @prop({ type: InterviewQAA })
    interviewQAA: InterviewQAA[];  // Questions, answers and analysis

    @prop()
    resumeFilePath: string;  // Path to the uploaded resume file

    @prop()
    resumeText: string;  // Extracted text content from the resume

    @prop({ default: true })
    isCompleted: boolean;  // Whether the interview is complete

    @prop({ default: false })
    isDeleted: boolean;  // Soft delete flag
}

export const InterviewModel = getModelForClass(Interview, {
    schemaOptions: { timestamps: true },
});
