import express, { Router } from "express";
import { verifyJwtToken } from "../../../utils/middleware/verify-jwt-token";
export const AuthRoutes: Router = express.Router();

import {
    sendOTPtoUser,
    verifyOTPofUser,
    resendOTPtoUser,
    testStatus,


} from "./auth.controllers";

// /api/auth/sendOTPtoUser
AuthRoutes.post("/sendOTPtoUser", sendOTPtoUser);

// /api/auth/verifyOTPofUser
AuthRoutes.post("/verifyOTPofUser", verifyOTPofUser);

// /api/auth/resendOTPtoUser
AuthRoutes.post("/resendOTPtoUser", resendOTPtoUser);



// /api/auth/testStatus
AuthRoutes.get("/testStatus", testStatus);

