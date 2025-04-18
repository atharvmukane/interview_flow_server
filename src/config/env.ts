import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  maxFileSize: 100 * 1024 * 1024, // 100MB max file size for audio uploads
};
