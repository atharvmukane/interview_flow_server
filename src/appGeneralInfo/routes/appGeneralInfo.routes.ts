import express, { Router } from "express";
import { verifyJwtToken } from "../../utils/middleware/verify-jwt-token";
import {
  createInfo,
  fetchInfo,
  updateInfo,
  fetchPolicy,
} from "../controller/appGeneralInfo.controller";

// export const AppGeneralInfoRoutes: Router = express.Router();
export const AppGeneralInfoRoutes = express.Router();


//api/appGeneralInfo/createInfo
AppGeneralInfoRoutes.post("/createInfo", verifyJwtToken, createInfo);

//api/appGeneralInfo/fetchInfo
AppGeneralInfoRoutes.post("/fetchInfo", verifyJwtToken, fetchInfo);

//api/appGeneralInfo/fetchPolicy
AppGeneralInfoRoutes.post("/fetchPolicy", fetchPolicy);

//api/appGeneralInfo/updateInfo
AppGeneralInfoRoutes.post("/updateInfo", verifyJwtToken, updateInfo);
