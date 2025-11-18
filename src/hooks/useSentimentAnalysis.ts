import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SentimentData } from "@/types/sentiment";
import { useToast } from "@/hooks/use-toast";


export const useSentimentAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeSentiment = async (text: string): Promise<SentimentData | null> => {
    setIsAnalyzing(true);
    console.log("Starting sentiment analysis for text:", text);
    
    try {
    
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
    isAnalyzing
  };
};
