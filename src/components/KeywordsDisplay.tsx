import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface KeywordsDisplayProps {
  keywords: string[];
}

export const KeywordsDisplay = ({ keywords }: KeywordsDisplayProps) => {
  const [displayedKeywords, setDisplayedKeywords] = useState<
    { word: string; id: string }[]
  >([]);

  useEffect(() => {
    // Add new keywords with unique IDs for animation
    const newKeywords = keywords
      .filter(
        (word) =>
          !displayedKeywords.some((displayed) => displayed.word === word)
      )
      .map((word) => ({
        word,
        id: `${word}-${Date.now()}-${Math.random()}`,
      }));

    if (newKeywords.length > 0) {
      setDisplayedKeywords((prev) => [...prev, ...newKeywords]);
    }
  }, [keywords]);

  if (displayedKeywords.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl p-6 max-w-2xl w-full smooth-transition">
      <h2 className="text-lg font-semibold mb-4 text-foreground/90">
        Key Topics
      </h2>
      <div className="flex flex-wrap gap-3">
        {displayedKeywords.map((item, index) => {
          // Highlight the most recent (last) keyword as top priority
          const isTopKeyword = index === displayedKeywords.length - 1;
          return (
            <Badge
              key={item.id}
              variant="secondary"
              className={`${
                isTopKeyword
                  ? "keyword-highlight px-6 py-3 text-lg bg-gradient-to-br from-primary/40 to-accent/40 text-primary border-primary/60 backdrop-blur-md font-bold shadow-lg"
                  : "keyword-enter px-4 py-2 text-sm bg-primary/15 text-primary/90 border-primary/25 backdrop-blur-sm"
              }`}
            >
              {isTopKeyword && "✨ "}
              {item.word}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
