# AudioTranscribe

A Node.js TypeScript application for audio file transcription using OpenAI's Whisper API.

## Project Overview

AudioTranscribe is a RESTful API service that allows users to upload audio files, store them on the server, and transcribe them using OpenAI's Whisper speech-to-text API. The application is built with Express.js and TypeScript, providing a robust and type-safe foundation.

## Features

- Upload audio files (mp3, wav, ogg, m4a, flac, webm, etc.)
- Store uploaded files in a server directory
- Transcribe audio files using OpenAI's Whisper API
- Combined upload and transcribe in a single request
- Access and transcribe previously uploaded files

## Prerequisites

- Node.js (v16+)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository (or extract from your downloaded zip)

2. Install dependencies:

```bash
npm install
```

## Environment Setup

1. Copy the example environment file to create your own:

```bash
cp .env.example .env
```

2. Open the `.env` file and configure with your settings:

```
# Server Configuration
PORT=3000

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set maximum file size for uploads (in bytes, default is 100MB)
# MAX_FILE_SIZE=104857600
```

3. **Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

   To get an OpenAI API key:

   - Visit [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
   - Sign up or log in to your OpenAI account
   - Create a new API key
   - Copy and paste the key into your .env file

4. Save the .env file with your changes.

## Building and Running

### Development mode

Run the application with hot-reloading for development:

```bash
npm run dev
```

### Production mode

Build and run the optimized version:

```bash
npm run build
npm start
```

### Debug mode

Run the application with debugging enabled:

```bash
npm run debug
```

You can also use VS Code's built-in debugger by pressing F5 or selecting "Debug TypeScript App" from the debug menu.

### Verifying the Application

Once running, open a browser and visit:

```
http://localhost:3000/
```

You should see the message: "Audio Transcription API is running"

## API Endpoints

### 1. Upload Audio

**POST** `/api/transcription/upload`

Upload an audio file to the server.

**Request:**

- Content-Type: `multipart/form-data`
- Form field: `audio` (file)

**Example using HTML form:**

```html
<form
  method="POST"
  action="/api/transcription/upload"
  enctype="multipart/form-data"
>
  <input type="file" name="audio" accept="audio/*" />
  <button type="submit">Upload</button>
</form>
```

**Example using curl:**

```bash
curl -X POST -F "audio=@/path/to/your/audiofile.mp3" http://localhost:3000/api/transcription/upload
```

**Response:**

```json
{
  "success": true,
  "message": "Audio uploaded successfully",
  "file": {
    "filename": "1744941848076-sample_1.m4a",
    "path": "C:\\path\\to\\public\\uploads\\1744941848076-sample_1.m4a"
  }
}
```

### 2. Transcribe Audio

**POST** `/api/transcription/transcribe`

Transcribe a previously uploaded audio file.

**Request Body:**

```json
{
  "filename": "1744941848076-sample_1.m4a"
}
```

**Example using curl:**

```bash
curl -X POST -H "Content-Type: application/json" -d "{\"filename\":\"1744941848076-sample_1.m4a\"}" http://localhost:3000/api/transcription/transcribe
```

**Response:**

```json
{
  "success": true,
  "transcription": "This is the transcribed text from the audio file..."
}
```

### 3. Upload and Transcribe in One Step

**POST** `/api/transcription/transcribe-uploads`

Upload an audio file and get its transcription in a single request.

**Request:**

- Content-Type: `multipart/form-data`
- Form field: `audio` (file)

**Example using HTML form:**

```html
<form
  method="POST"
  action="/api/transcription/transcribe-uploads"
  enctype="multipart/form-data"
>
  <input type="file" name="audio" accept="audio/*" />
  <button type="submit">Upload & Transcribe</button>
</form>
```

**Example using curl:**

```bash
curl -X POST -F "audio=@/path/to/your/audiofile.mp3" http://localhost:3000/api/transcription/transcribe-uploads
```

**Response:**

```json
{
  "success": true,
  "message": "Audio uploaded and transcribed successfully",
  "file": {
    "filename": "1744941848076-sample_1.m4a",
    "path": "C:\\path\\to\\public\\uploads\\1744941848076-sample_1.m4a"
  },
  "transcription": "This is the transcribed text from the audio file..."
}
```

## Project Structure

```
.
├── public/               # Public static files
│   └── uploads/          # Storage for uploaded audio files
├── src/                  # Source code
│   ├── config/           # Configuration files
│   │   └── env.ts        # Environment variables config
│   ├── controllers/      # Request controllers
│   │   └── transcriptionController.ts
│   ├── routes/           # API routes
│   │   └── transcriptionRoutes.ts
│   ├── utils/            # Utility functions
│   │   └── transcription.ts  # OpenAI Whisper API integration
│   └── index.ts          # Application entry point
├── .env                  # Environment variables
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Error Handling

The API provides detailed error messages for various scenarios:

- Missing or invalid files
- Authentication issues with OpenAI API
- Transcription failures
- File system errors

## Limitations

- Maximum file size is capped at 100MB
- Only supports audio formats compatible with Whisper API
- Requires a valid OpenAI API key with sufficient credits

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
