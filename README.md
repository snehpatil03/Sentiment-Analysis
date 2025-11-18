Sentiment Aura — Real-Time Speech Sentiment Visualization
A full-stack real-time application that captures microphone audio, streams it to a transcription service, analyzes emotional sentiment + keywords via an AI model, and generates a live, reactive Perlin-noise “aura” visualization based on the user's mood.

This project satisfies all requirements from the Memory Machines Live AI-Powered "Sentiment Aura" challenge.
It focuses on: full-stack orchestration, clean UI, real-time streaming, data-driven generative visuals, and robust async handling.

🚀 Demo Video 
https://drive.google.com/file/d/1GXwCnS3Xus647uhCt8txLLgfcFvvkSTZ/view?usp=sharing

📌 Features
🎤 1. Real-Time Speech Transcription

Captures microphone audio using Web Audio API.

Streams raw PCM audio to Deepgram via WebSocket.

Displays live rolling transcript (partial + final).

🧠 2. AI Sentiment + Keywords Extraction

When a final transcript is received:

A backend edge function processes the text.

AI model returns:

sentiment_score (0–1)

sentiment_label ("positive", "neutral", "negative")

mood (e.g., "happy", "stressed", "calm")

keywords[] (3–5 extracted topics)

🎨 3. Generative Perlin Noise Visualization

Built using p5.js inside React.

Visualization dynamically responds to:

Sentiment label → color hue

Sentiment score → motion + energy

Keyword count → density + particle complexity

Smooth transitions (lerp) for a "calm, liquid-like" effect.

🧩 4. Modern UX Components

TranscriptDisplay: auto-scrolling, semi-transparent glass UI.

KeywordsDisplay: animated keyword pills with fade-in + glow.

Mood Badge: emoji + color-coded mood analyzer.

Controls: Start/Stop recording with status indicator.

🛡 5. Error & Edge Case Handling

Handles Deepgram disconnects (reconnect logic).

Handles AI API failures with fallbacks.

Prevents duplicate keywords.

Validates empty or unclear transcripts.

Displays toast notifications for rate-limit issues.

🏗 Architecture Overview
Frontend (React + TypeScript + p5.js)

Audio capture

WebSocket stream to Deepgram

Real-time UI components

Perlin-noise visualization

Backend (Edge Function / API)

/analyze-sentiment endpoint

Sends transcript → AI Model → structured JSON response

Returns:

{
  "sentiment_score": 0.87,
  "sentiment_label": "positive",
  "mood": "excited",
  "keywords": ["presentation", "success", "happy"]
}

External APIs

Deepgram — real-time transcription

AI Model (OpenAI / Gemini / Claude equivalent) — sentiment + keywords

🔄 Data Flow (End-to-End)

(Matches exactly the data flow in the PDF brief)

User clicks Start

React requests mic access

Audio streamed → Deepgram WebSocket

Deepgram returns:

partial transcripts

final transcripts

On is_final: true:

Frontend POSTs text → backend API

Backend performs AI sentiment analysis

AI returns structured JSON

UI updates:

aura visualization

keyword pills

mood badge

React re-renders everything smoothly

🛠 Tech Stack
Frontend

React + TypeScript

Vite

p5.js (Perlin Noise visualization)

TailwindCSS

Axios (HTTP calls)

Web Audio API + WebSocket

Backend

Edge Function / API Route

AI model integration (Gemini / OpenAI-compatible)

Third-Party APIs

Deepgram (Transcription API)

📦 Project Structure
Sentiment_Analysis/
│
├── public/
│   └── robots.txt
│
├── src/
│   ├── components/       # AuraCanvas, KeywordsDisplay, SentimentMeter
│   ├── hooks/            # useDeepgram, useSentimentAnalysis
│   ├── pages/            # Index.tsx, NotFound.tsx
│   ├── lib/              # utilities
│   ├── types/            # TypeScript definitions
│   ├── main.tsx          # entry file
│   └── index.css         # global styles
│
├── supabase/
│   └── functions/
│       └── analyze-sentiment/
│           └── index.ts  # backend sentiment logic
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md

🧪 Running Locally
1️⃣ Install dependencies
npm install

2️⃣ Add environment variables

Create a .env file:

VITE_DEEPGRAM_API_KEY=your_key_here
AI_API_KEY=your_ai_key

3️⃣ Run development server
npm run dev


Project is available at:

👉 http://localhost:5173

📤 Deployment

You can deploy the project on:

Vercel (recommended for frontend)

Netlify

Render / Railway for backend functions

Just set the environment variables inside the platform dashboard.

📝 Future Enhancements

Multi-speaker detection

Emotion time-series graph

Save conversation history

Animated 3D aura mode (Three.js)

WebRTC collaborative visualization

👤 Author

Sneh Patil
Full-Stack Developer • AI Systems • Real-Time Applications
