import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import fileUpload from "express-fileupload";

import mongoose, { ConnectOptions } from "mongoose";

// import { ConnectOptions } from 'mongoose';
import { errorHandler } from "./utils/middleware/error.middleware";

import { config } from "./config/env";

const mainRoutes = require("./mainRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());

// File upload middleware
app.use(
  fileUpload({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size for resumes and other files
    },
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
    createParentPath: true,
  })
);

// Increase JSON payload size limit for base64 encoded audio (100MB)
app.use(express.json({ limit: "5000mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "5000mb",
    parameterLimit: 50000000,
  })
);

mongoose
  .connect(
    "mongodb+srv://techiteeha:WeYl8zXdBqLsUaku@cluster0.xzhtsar.mongodb.net/Iteeha?retryWrites=true&w=majority",
    // // "mongodb+srv://techiteeha:WeYl8zXdBqLsUaku@cluster0.xzhtsar.mongodb.net/Zanes?retryWrites=true&w=majority",
    // "mongodb+srv://vikasraj:Future@cluster0.8gnmr.mongodb.net/Iteeha_DB?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false,
      // useCreateIndex: true,
    } as ConnectOptions
  )
  .then(() => {
    console.log("Connected to database!");
  })
  .catch((error) => {
    console.log("Connection failed!", error);
  });

mongoose.set("debug", false);

// Serve static files from public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

app.use("/api", mainRoutes);
app.use(errorHandler);

// // API routes
// app.use("/api/transcription", transcriptionRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Server running");
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
