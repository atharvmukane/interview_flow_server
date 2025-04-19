import express, { Router } from 'express';

import { AuthRoutes } from './utils/generic/auth/auth.routes';
import { ChatGPTRouter } from './chatgpt_module/chatgpt.routes';
import { UserRoutes } from './userModule/user.routes';
import { InterviewRouter } from './interview_module/interview.route';
const app = express();

// ---------------------------------- Auth Routes ----------------------------------

// api/auth
app.use('/auth', AuthRoutes);

// api/user
app.use('/user', UserRoutes);

// api/chatgpt
app.use('/chatgpt', ChatGPTRouter);

// api/interview
app.use('/interview', InterviewRouter);

// ---------------------------------- Admin Routes ----------------------------------

// ---------------------------------- App Routes ----------------------------------

// api/user
// app.use('/user', UserRoutes);

module.exports = app;
