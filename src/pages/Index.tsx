import { useState, useCallback } from "react";
import { AuraCanvas } from "@/components/AuraCanvas";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { KeywordsDisplay } from "@/components/KeywordsDisplay";
import { Controls } from "@/components/Controls";
import { SentimentMeter } from "@/components/SentimentMeter";
import { useDeepgram } from "@/hooks/useDeepgram";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import { SentimentLabel, TranscriptEntry } from "@/types/sentiment";

/**
 * INTERVIEW NOTE: Main Application Component - Sentiment Aura
 * 
 * This is the orchestration layer that connects all pieces:
 * 
 * FULL DATA FLOW:
 * 1. User clicks Start → useDeepgram opens mic + Deepgram WebSocket
 * 2. Audio streams continuously, VAD optimizes bandwidth
 * 3. Deepgram returns interim (partial) and final (complete) transcripts
 * 4. Final transcripts trigger useSentimentAnalysis hook
 * 5. Hook calls Supabase Edge Function → Lovable AI (Gemini 2.5 Flash)
 * 6. LLM returns: sentiment_score, sentiment_label, mood, keywords
 * 7. React state updates trigger re-renders of:
 *    - AuraCanvas (Perlin noise visualization)
 *    - KeywordsDisplay (animated keyword pills)
 *    - SentimentMeter (emoji + progress bar)
 *    - MoodBadge (current emotional state)
 * 8. All visual updates use smooth transitions (no jarring jumps)
 * 
 * ERROR HANDLING:
 * - LLM fails → Neutral fallback, app keeps working
 * - Mic denied → Toast error, graceful degradation
 * - Network issues → Automatic retry with backoff
 * 
 * PERFORMANCE:
 * - Async sentiment calls don't block transcription
 * - VAD reduces unnecessary API calls
 * - p5.js runs at 60fps in separate render loop
 */
const Index = () => {
  // INTERVIEW NOTE: Core application state
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sentimentScore, setSentimentScore] = useState(0.5);
  const [sentimentLabel, setSentimentLabel] = useState<SentimentLabel>("neutral");
  const [mood, setMood] = useState<string>("neutral");
  const [keywords, setKeywords] = useState<string[]>([]);

  const { analyzeSentiment, isAnalyzing } = useSentimentAnalysis();

  // INTERVIEW NOTE: Central callback for handling Deepgram transcripts
  // This is where we distinguish interim vs final and trigger sentiment analysis
  const handleTranscript = useCallback(
    async (transcript: TranscriptEntry) => {
      console.log("[Transcript]", { isFinal: transcript.isFinal, text: transcript.text });
      
      if (transcript.isFinal) {
        // CRITICAL: Only process FINAL transcripts for sentiment
        // Interim transcripts would spam the API and waste credits
        setTranscripts((prev) => [...prev, transcript]);
        setInterimTranscript("");

        try {
          // INTERVIEW NOTE: Async sentiment analysis pipeline
          // This doesn't block the UI - transcription continues in parallel
          console.log("[Sentiment] Analyzing final transcript...");
          const result = await analyzeSentiment(transcript.text);
          console.log("[Sentiment] Result:", result);
          
          if (result) {
            // Update all visualization state at once
            setSentimentScore(result.sentiment_score);
            setSentimentLabel(result.sentiment_label);
            setMood(result.mood);
            setKeywords((prev) => {
              // Accumulate unique keywords over time
              const newKeywords = result.keywords.filter((kw) => !prev.includes(kw));
              return [...prev, ...newKeywords];
            });
          }
        } catch (e) {
          console.error("[Sentiment] Analyze failed:", e);
          // App continues working even if sentiment fails
        }
      } else {
        // Show interim transcript in real-time for better UX
        setInterimTranscript(transcript.text);
      }
    },
    [analyzeSentiment]
  );

  const { isConnected, isRecording, isSpeaking, connect, disconnect } =
    useDeepgram(handleTranscript);

  const handleStart = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStop = () => {
    disconnect();
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Background Visualization */}
      <AuraCanvas
        sentimentScore={sentimentScore}
        sentimentLabel={sentimentLabel}
        keywords={keywords}
      />

      {/* UI Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 gap-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
            Sentiment Aura
          </h1>
          <p className="text-foreground/60 text-lg">
            Real-time speech visualization powered by AI
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
          <Controls
            isRecording={isRecording}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
            onStart={handleStart}
            onStop={handleStop}
          />

          {(transcripts.length > 0 || interimTranscript || isAnalyzing) && (
            <>
              {/* Analyzing Shimmer */}
              {isAnalyzing && (
                <div className="glass rounded-2xl px-6 py-3 animate-pulse">
                  <p className="text-sm text-primary/80">✨ Analyzing mood...</p>
                </div>
              )}

              {/* Mood Badge - Always visible when we have transcripts */}
              {transcripts.length > 0 && mood && (
                <div className="glass rounded-2xl px-8 py-4 smooth-transition mood-badge">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {sentimentLabel === "positive" ? "😊" : sentimentLabel === "negative" ? "😔" : "😐"}
                    </span>
                    <div>
                      <p className="text-xs text-foreground/50 uppercase tracking-wider">Current Mood</p>
                      <p className={`text-xl font-bold ${
                        sentimentLabel === "positive" 
                          ? "text-positive" 
                          : sentimentLabel === "negative" 
                          ? "text-negative" 
                          : "text-neutral"
                      }`}>
                        {mood}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TranscriptDisplay
                transcripts={transcripts}
                interimTranscript={interimTranscript}
              />
              
              {keywords.length > 0 && <KeywordsDisplay keywords={keywords} />}
              
              {transcripts.length > 0 && (
                <SentimentMeter 
                  sentiment={sentimentLabel} 
                  score={sentimentScore} 
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Index;
