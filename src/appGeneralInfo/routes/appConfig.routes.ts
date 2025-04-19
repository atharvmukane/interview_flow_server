const express = require("express");
import {
  insertAppConfig,
  fetchAppConfig,
  fetchCommonAppConfig,
  fetchAllRoutes,
  getAppConfigs,
} from "../controller/appConfig.controller";
export const AppConfigRoutes = express.Router();

// api/appConfig/insertAppConfig
AppConfigRoutes.post("/insertAppConfig", insertAppConfig);

// api/appConfig/fetchAppConfig
AppConfigRoutes.post("/fetchAppConfig", fetchAppConfig);

// api/appConfig/fetchCommonAppConfig
AppConfigRoutes.post("/fetchCommonAppConfig", fetchCommonAppConfig);

// api/appConfig/fetchAllRoutes
AppConfigRoutes.post("/fetchAllRoutes", fetchAllRoutes);

// api/appConfig/getAppConfigs
AppConfigRoutes.post("/getAppConfigs", getAppConfigs);
