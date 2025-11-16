import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SentimentData } from "@/types/sentiment";
import { useToast } from "@/hooks/use-toast";

/**
 * INTERVIEW NOTE: Sentiment Analysis Hook
 * 
 * This hook connects the frontend to the backend sentiment analysis pipeline:
 * 
 * Data Flow:
 * 1. Receives final transcript text from useDeepgram
 * 2. Calls Supabase Edge Function "analyze-sentiment"
 * 3. Edge function uses Lovable AI (Gemini 2.5 Flash) for LLM analysis
 * 4. Returns structured sentiment data: score, label, mood, keywords
 * 5. Updates React state which triggers UI updates (aura, mood badge, keywords)
 * 
 * Error Handling:
 * - Network failures → Show toast + return neutral fallback
 * - LLM rate limits → Handled in edge function, fallback provided
 * - Invalid responses → Graceful degradation with heuristic keywords
 * 
 * This pattern keeps the LLM API key secure on the backend while providing
 * a smooth, non-blocking user experience.
 */
export const useSentimentAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeSentiment = async (text: string): Promise<SentimentData | null> => {
    setIsAnalyzing(true);
    console.log("Starting sentiment analysis for text:", text);
    
    try {
      // INTERVIEW NOTE: Supabase Edge Function invocation
      // This is serverless - scales automatically, keeps API keys secure
      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { text },
      });

      if (error) {
        console.error("Supabase function invoke error:", error);
        throw error;
      }

      console.log("Sentiment analysis response:", data);
      return data as SentimentData;
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze sentiment. Using fallback.",
        variant: "destructive",
      });
      
      // INTERVIEW NOTE: Graceful degradation - app continues working
      // Extract simple keywords as fallback instead of breaking
      return {
        sentiment_score: 0.5,
        sentiment_label: "neutral",
        mood: "undetermined",
        keywords: text.split(" ").filter(w => w.length > 4).slice(0, 3),
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeSentiment,
    isAnalyzing,
  };
};
