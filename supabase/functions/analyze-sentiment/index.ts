/**
 * INTERVIEW NOTE: Sentiment Analysis Edge Function
 * 
 * Architecture: Serverless function deployed on Supabase Edge Runtime (Deno)
 * 
 * Purpose:
 * - Receives user transcript from frontend
 * - Calls Lovable AI Gateway (Gemini 2.5 Flash model)
 * - Uses structured output via function calling for guaranteed JSON
 * - Returns sentiment analysis: score, label, mood, keywords
 * 
 * Why Edge Function vs Client-Side?
 * 1. Security: API keys stay on server, never exposed to browser
 * 2. Rate limiting: Centralized control, user can't spam API
 * 3. Scalability: Auto-scales with traffic, no server management
 * 4. Flexibility: Easy to switch AI providers without frontend changes
 * 
 * Error Handling Strategy:
 * - Invalid input → Return neutral fallback
 * - Rate limits (429) → Return fallback with error message
 * - Out of credits (402) → Return fallback with payment message
 * - LLM failures → Log error, return neutral fallback
 * 
 * This ensures the frontend NEVER breaks, even if AI calls fail.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SentimentResponse {
  sentiment_score: number;
  sentiment_label: "positive" | "neutral" | "negative";
  mood: string;
  keywords: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let text = "";
  
  try {
    const body = await req.json();
    text = body.text;

    if (!text || typeof text !== "string") {
      console.error("Invalid text input:", text);
      throw new Error("Invalid text input");
    }

    // INTERVIEW NOTE: Lovable AI Gateway - Pre-configured LLM access
    // This is automatically provided in Lovable Cloud environments
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Analyzing text:", text);

    // INTERVIEW NOTE: Using function calling for structured output
    // This forces the LLM to return valid JSON in exactly the format we need
    // Benefit: No parsing errors, guaranteed type safety
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Fast, cost-effective model
        messages: [
          {
            role: "system",
            content:
              "You are a sentiment analysis expert. Analyze the given text and extract sentiment and keywords.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        // INTERVIEW NOTE: Function calling schema
        // This is OpenAI-compatible API format that works with Lovable AI Gateway
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_sentiment",
              description:
                "Analyze sentiment and extract keywords from the given text",
              parameters: {
                type: "object",
                properties: {
                  sentiment_score: {
                    type: "number",
                    description:
                      "Sentiment score from 0 (very negative) to 1 (very positive)",
                  },
                  sentiment_label: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "Overall sentiment classification",
                  },
                  mood: {
                    type: "string",
                    description:
                      "A short human-readable mood description (e.g. 'calm and content', 'anxious but hopeful', 'stressed')",
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "3-5 key topics or important words from the text",
                  },
                },
                required: ["sentiment_score", "sentiment_label", "mood", "keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "analyze_sentiment" },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, response.statusText);
      console.error("Error details:", errorText);
      
      // INTERVIEW NOTE: Graceful error handling with specific status codes
      
      // Rate limit (429): Too many requests
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
            sentiment_score: 0.5,
            sentiment_label: "neutral",
            mood: "undetermined",
            keywords: text.split(" ").filter(w => w.length > 4).slice(0, 3),
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Payment required (402): Out of credits
      if (response.status === 402) {
        console.error("Payment required - out of credits");
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits to continue.",
            sentiment_score: 0.5,
            sentiment_label: "neutral",
            mood: "undetermined",
            keywords: text.split(" ").filter(w => w.length > 4).slice(0, 3),
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`Lovable AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Lovable AI response:", JSON.stringify(data));

    // INTERVIEW NOTE: Extract the structured function call result
    // The LLM returns JSON in the tool_calls array, not in message.content
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_sentiment") {
      console.error("Unexpected OpenAI response format. Full response:", JSON.stringify(data));
      throw new Error("Unexpected OpenAI response format");
    }

    // Parse the JSON arguments returned by the LLM
    const result: SentimentResponse = JSON.parse(
      toolCall.function.arguments
    );

    console.log("Analysis result:", result);

    // Return clean JSON response to frontend
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-sentiment function:", error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // INTERVIEW NOTE: Ultimate fallback - never let the frontend break
    // Extract simple keywords from the original text as a heuristic
    let fallbackKeywords = ["analysis", "error"];
    if (text && typeof text === "string") {
      const words = text
        .split(" ")
        .filter(w => w.length > 4)
        .slice(0, 3);
      if (words.length > 0) {
        fallbackKeywords = words;
      }
    }

    // Return neutral sentiment with basic keywords
    const fallback: SentimentResponse = {
      sentiment_score: 0.5,
      sentiment_label: "neutral",
      mood: "undetermined",
      keywords: fallbackKeywords,
    };

    console.log("Returning fallback response:", fallback);

    // Still return 200 OK so frontend continues working
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
