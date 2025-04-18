import OpenAI from "openai";
import { config } from "../config/env";
import path from "path";
import fs from "fs";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("Audio file not found");
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
