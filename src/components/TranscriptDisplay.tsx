import { useEffect, useRef } from "react";
import { TranscriptEntry } from "@/types/sentiment";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[];
  interimTranscript: string;
}

export const TranscriptDisplay = ({
  transcripts,
  interimTranscript,
}: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimTranscript]);

  return (
    <div className="glass rounded-2xl p-6 max-w-2xl w-full smooth-transition">
      <h2 className="text-lg font-semibold mb-4 text-foreground/90">
        Live Transcript
      </h2>
      <ScrollArea className="h-[300px]">
        <div ref={scrollRef} className="space-y-2 pr-4">
          {transcripts.map((entry, index) => (
            <p
              key={index}
              className="text-foreground/80 leading-relaxed"
            >
              {entry.text}
            </p>
          ))}
          {interimTranscript && (
            <p className="text-foreground/50 italic leading-relaxed">
              {interimTranscript}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
