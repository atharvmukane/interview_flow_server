const express = require("express");
import { login, signup, editProfile, refreshUser, deleteFCMToken, deleteAccount } from './user.controller';
import { verifyJwtToken } from "./../utils/middleware/verify-jwt-token";


export const UserRoutes = express.Router();


// api/user/login
UserRoutes.get("/login", login);

// // api/user/signup
UserRoutes.post("/signup", signup);

// api/user/refreshUser
UserRoutes.get("/refreshUser", verifyJwtToken, refreshUser);

// api/user/editProfile
UserRoutes.put("/editProfile", verifyJwtToken, editProfile);

// // api/user/editProfile
// UserRoutes.put("/editProfile", verifyJwtToken, editProfile);

// // api/user/updateAddress
// UserRoutes.put("/updateAddress", verifyJwtToken, updateAddress);

// api/user/deleteFCMToken
UserRoutes.put("/deleteFCMToken", verifyJwtToken, deleteFCMToken);

//  api/user/deleteAccount
UserRoutes.put("/deleteAccount", verifyJwtToken, deleteAccount);

