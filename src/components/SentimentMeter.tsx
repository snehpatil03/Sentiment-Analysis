import { SentimentLabel } from "@/types/sentiment";

interface SentimentMeterProps {
  sentiment: SentimentLabel;
  score: number;
}

export const SentimentMeter = ({ sentiment, score }: SentimentMeterProps) => {
  const getSentimentColor = () => {
    switch (sentiment) {
      case "positive":
        return "from-positive to-primary";
      case "negative":
        return "from-negative to-accent";
      default:
        return "from-neutral to-primary";
    }
  };

  const getSentimentEmoji = () => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "negative":
        return "😔";
      default:
        return "😐";
    }
  };

  const getSentimentText = () => {
    switch (sentiment) {
      case "positive":
        return "Positive";
      case "negative":
        return "Negative";
      default:
        return "Neutral";
    }
  };

  return (
    <div className="glass rounded-2xl p-6 max-w-md w-full smooth-transition">
      <h2 className="text-lg font-semibold mb-4 text-foreground/90">
        Current Mood
      </h2>
      
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl">{getSentimentEmoji()}</div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold bg-gradient-to-r ${getSentimentColor()} bg-clip-text text-transparent mb-2`}>
            {getSentimentText()}
          </div>
          <div className="text-sm text-foreground/60">
            Confidence: {Math.round(score * 100)}%
          </div>
        </div>

        {/* Visual meter */}
        <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getSentimentColor()} smooth-transition`}
            style={{ width: `${score * 100}%` }
          />
        </div>
      </div>
    </div>
  );
};
