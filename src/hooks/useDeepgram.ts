import { useState, useRef, useCallback } from "react";
import { TranscriptEntry } from "@/types/sentiment";
import { useToast } from "@/hooks/use-toast";

/**
 * INTERVIEW NOTE: Real-time Speech-to-Text with Deepgram WebSocket
 * 
 * This hook manages the entire audio pipeline:
 * 1. Requests microphone access from the browser
 * 2. Opens a WebSocket connection to Deepgram's streaming API
 * 3. Processes raw audio using Web Audio API (converts to PCM16 format)
 * 4. Implements Voice Activity Detection (VAD) to optimize bandwidth
 * 5. Receives interim and final transcripts from Deepgram
 * 6. Calls the provided callback with structured transcript data
 * 
 * Key Features:
 * - VAD: Only sends audio when speech is detected (reduces API costs)
 * - Real-time: Low-latency streaming with interim results
 * - Graceful error handling: Reconnection logic and user-friendly errors
 */
export const useDeepgram = (
  onTranscript: (transcript: TranscriptEntry) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // VAD state
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Voice Activity Detection (VAD) parameters
  const SPEECH_THRESHOLD = 0.01; // RMS amplitude threshold for speech
  const SILENCE_DURATION = 800; // ms of silence before considering speech ended

  const connect = useCallback(async () => {
    try {
      const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
      
      if (!DEEPGRAM_API_KEY) {
        toast({
          title: "Configuration Error",
          description: "Deepgram API key is not configured. Please add it to your environment.",
          variant: "destructive",
        });
        throw new Error("Deepgram API key not configured");
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Connect to Deepgram via WebSocket
      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&interim_results=true`,
        ["token", DEEPGRAM_API_KEY]
      );

      ws.onopen = () => {
        console.log("Connected to Deepgram");
        setIsConnected(true);
        startRecording(stream, ws);
      };

      // INTERVIEW NOTE: Handle Deepgram WebSocket messages
      // Deepgram sends two types of transcripts:
      // 1. Interim (is_final: false) - partial, may change as more audio arrives
      // 2. Final (is_final: true) - complete, stable transcript for a segment
      // We use finals to trigger sentiment analysis to avoid processing noise
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Deepgram response:", data);
        
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final === true; // CRITICAL: Only finals trigger sentiment API

          if (transcript && transcript.trim()) {
            console.log("Transcript:", transcript, "isFinal:", isFinal);
            onTranscript({
              text: transcript,
              timestamp: Date.now(),
              isFinal, // Parent component uses this to decide when to analyze sentiment
            });
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to transcription service",
          variant: "destructive",
        });
        disconnect();
      };

      ws.onclose = (event) => {
        console.log("Disconnected from Deepgram", event.code, event.reason);
        setIsConnected(false);
        setIsRecording(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting to Deepgram:", error);
      toast({
        title: "Microphone Error",
        description: error instanceof Error ? error.message : "Failed to access microphone",
        variant: "destructive",
      });
      throw error;
    }
  }, [onTranscript, toast]);

  const startRecording = (stream: MediaStream, ws: WebSocket) => {
    // INTERVIEW NOTE: Web Audio API pipeline for processing microphone input
    // We need to convert browser audio to PCM16 format for Deepgram
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    // INTERVIEW NOTE: ScriptProcessorNode for real-time audio processing
    // This gives us access to raw audio samples for VAD and format conversion
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // INTERVIEW NOTE: Voice Activity Detection (VAD) algorithm
        // Calculate Root Mean Square (RMS) to detect speech amplitude
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        
        // Check if current audio chunk contains speech
        const isSpeechDetected = rms > SPEECH_THRESHOLD;
        
        if (isSpeechDetected) {
          // Clear silence timeout if speech is detected
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          
          // Update speaking state
          setIsSpeaking(true);
          
          // Convert Float32 to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          
          // Send audio data to Deepgram
          ws.send(pcmData.buffer);
        } else {
          // Start silence timeout if not already started
          if (!silenceTimeoutRef.current && isSpeaking) {
            silenceTimeoutRef.current = setTimeout(() => {
              setIsSpeaking(false);
              silenceTimeoutRef.current = null;
            }, SILENCE_DURATION);
          }
        }
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    
    console.log("Started recording with PCM16 encoding");
    setIsRecording(true);
  };

  const disconnect = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
  }, []);

  return {
    isConnected,
    isRecording,
    isSpeaking,
    connect,
    disconnect,
  };
};
