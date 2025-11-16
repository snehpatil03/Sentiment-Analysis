export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentData {
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  mood: string;
  keywords: string[];
}

export interface TranscriptEntry {
  text: string;
  timestamp: number;
  isFinal: boolean;
}
