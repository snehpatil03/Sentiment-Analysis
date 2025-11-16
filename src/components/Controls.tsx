import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface ControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const Controls = ({
  isRecording,
  isConnected,
  isSpeaking,
  onStart,
  onStop,
}: ControlsProps) => {
  return (
    <div className="glass rounded-2xl p-8 flex flex-col items-center gap-6 smooth-transition">
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full ${
            isRecording
              ? "bg-destructive pulse-recording"
              : "bg-muted"
          }`}
        />
        <span className="text-sm font-medium text-foreground/80">
          {isRecording ? (isSpeaking ? "Speaking..." : "Listening...") : isConnected ? "Connected" : "Ready"}
        </span>
      </div>

      <Button
        onClick={isRecording ? onStop : onStart}
        size="lg"
        className={`w-48 h-16 text-lg font-semibold rounded-xl smooth-transition ${
          isRecording
            ? "bg-destructive hover:bg-destructive/90"
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        {isRecording ? (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            Stop
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Start
          </>
        )}
      </Button>

      <p className="text-xs text-foreground/60 text-center max-w-xs">
        Click Start to begin recording. Your speech will be transcribed in
        real-time and analyzed for sentiment.
      </p>
    </div>
  );
};
