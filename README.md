Sentiment Aura — Real-Time Speech Emotion Visualizer

A full-stack web application that performs live speech transcription, extracts sentiment, mood, and keywords, and visualizes them using a generative Perlin-noise aura.

This project demonstrates frontend + backend + AI orchestration in real-time.

🚀 Features
🎤 Live Speech Transcription

Streams microphone audio to Deepgram in real-time

Shows interim and final transcripts

Smart VAD (voice activity detection)

🧠 AI-Powered Sentiment & Mood Analysis

Extracts:

sentiment_score (0–1)

sentiment_label (positive / neutral / negative)

mood (happy, stressed, calm, excited, etc.)

keywords[] (3–5 important topic keywords)

Powered by AI model through a backend edge function

🌈 Generative Visualization (p5.js)

Dynamic Perlin Noise "Aura"

Aura reacts to:

Sentiment score → Energy & motion

Sentiment label → Color hue mapping

Keywords → Density & glow

Smooth transitions using interpolation

💬 Keywords Highlight

Animated keyword pills

First keyword gets a glowing badge

Auto-fade and float-in animations

🧩 Clear, Real-Time UI

Start/Stop button

Live transcript panel

Mood badge with emoji

Analyzing shimmer when waiting for AI response

🏗️ Tech Stack
Frontend

React + TypeScript

Vite

p5.js (custom generative art)

Axios

Web Audio API

WebSockets

Backend

FastAPI (or Edge Function)

AI Model API for sentiment+keywords

JSON output parsing

CORS-enabled

APIs

⭐ Deepgram — Transcription

⭐ AI Model API — Sentiment, keywords, mood

📂 Project Structure
/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuraCanvas.tsx
│   │   │   ├── KeywordsDisplay.tsx
│   │   │   ├── SentimentMeter.tsx
│   │   ├── hooks/
│   │   │   ├── useDeepgram.ts
│   │   │   ├── useSentimentAnalysis.ts
│   │   ├── pages/
│   │   │   ├── Index.tsx
│   │   ├── index.css
│   ├── package.json
│   ├── vite.config.ts
|
├── backend/
│   ├── app.py
│   ├── requirements.txt
|
└── README.md

🛠️ Local Development
1️⃣ Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

2️⃣ Frontend
cd frontend
npm install
npm run dev


Open:
👉 http://localhost:5173

🌈 How the Aura Visualization Works
Sentiment Label	Color
Positive	Gold / Warm tones
Neutral	Cyan / Teal
Negative	Deep blue / Violet
Sentiment Score	Effect
0.0–0.3	Slow, soft motion
0.4–0.6	Balanced flow
0.7–1.0	Fast, energetic, strong trails

Keywords affect:

Density

Glow effects

Particle speed

🧪 Example Outputs
Input:

“I feel really happy today, everything is going great!”

Output:
{
  "sentiment_score": 0.92,
  "sentiment_label": "positive",
  "mood": "happy",
  "keywords": ["happy", "today", "great"]
}


Aura turns:

Warm golden

High energy

Dense glowing lines

🎯 What This Project Demonstrates

✔ Full-stack engineering
✔ Real-time async orchestration
✔ WebSockets
✔ AI model integration
✔ Visualization engineering
✔ UI/UX polish
✔ Error handling & graceful fallbacks

Perfect for:

AI engineering interviews

Full-stack assessments

Creative coding portfolios

Showcasing AI + visualization skills

📄 License

MIT License

🙋‍♂️ Author

Sneh Patil