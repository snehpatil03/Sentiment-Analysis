import { useEffect, useRef } from "react";
import { SentimentLabel } from "@/types/sentiment";
import p5 from "p5";

interface AuraCanvasProps {
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  keywords: string[];
}

/**
 * INTERVIEW NOTE: Dynamic Perlin Noise Visualization with p5.js
 * 
 * This component creates a full-screen "aura" that reacts to user sentiment:
 * 
 * Visual Algorithm:
 * 1. Creates a 2D Perlin noise flow field (smooth, organic randomness)
 * 2. Spawns 300 particles that follow the flow field vectors
 * 3. Particles leave trails creating fluid, animated patterns
 * 4. Color, speed, and energy map directly to sentiment analysis results
 * 
 * Sentiment Mapping:
 * - POSITIVE: Warm gold (hue 50°), high energy, fast flow
 * - NEGATIVE: Cool blue (hue 240°), low energy, slow flow  
 * - NEUTRAL: Cyan (hue 200°), medium energy, medium flow
 * - KEYWORDS: Each keyword adds energy boost (more motion/thickness)
 * 
 * Technical Details:
 * - Uses lerp() for smooth 60fps transitions 
 * - Particles wrap at edges for continuous motion
 * - HSB color mode for intuitive hue shifts
 * - Canvas resizes responsively to window
 */
export const AuraCanvas = ({
  sentimentScore,
  sentimentLabel,
  keywords,
}: AuraCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  
  const sentimentRef = useRef({ score: sentimentScore, label: sentimentLabel, keywords });
  
  // Update refs when props change 
  useEffect(() => {
    sentimentRef.current = { score: sentimentScore, label: sentimentLabel, keywords };
  }, [sentimentScore, sentimentLabel, keywords]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Target values for smooth transitions
    let targetHue = 280;
    let targetSaturation = 70;
    let targetBrightness = 50;
    let targetEnergy = 0.5;
    let targetFlowSpeed = 0.002;
    let targetStrokeWeight = 2;

    // Current values 
    let currentHue = targetHue;
    let currentSaturation = targetSaturation;
    let currentBrightness = targetBrightness;
    let currentEnergy = targetEnergy;
    let currentFlowSpeed = targetFlowSpeed;
    let currentStrokeWeight = targetStrokeWeight;

    const sketch = (p: p5) => {
      let particles: Particle[] = [];
      const particleCount = 300;
      let noiseScale = 0.01;
      let time = 0;
      
      // Track last sentiment for change detection
      let lastLabel = sentimentRef.current.label;
      let lastKeywordCount = sentimentRef.current.keywords.length;

      class Particle {
        pos: p5.Vector;
        vel: p5.Vector;
        acc: p5.Vector;
        prevPos: p5.Vector;
        alpha: number;

        constructor() {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.vel = p.createVector(0, 0);
          this.acc = p.createVector(0, 0);
          this.prevPos = this.pos.copy();
          this.alpha = p.random(100, 255);
        }

        update() {
          this.vel.add(this.acc);
          this.vel.limit(4 * currentEnergy);
          this.pos.add(this.vel);
          this.acc.mult(0);

          // Wrap around edges
          if (this.pos.x < 0) {
            this.pos.x = p.width;
            this.prevPos.x = p.width;
          }
          if (this.pos.x > p.width) {
            this.pos.x = 0;
            this.prevPos.x = 0;
          }
          if (this.pos.y < 0) {
            this.pos.y = p.height;
            this.prevPos.y = p.height;
          }
          if (this.pos.y > p.height) {
            this.pos.y = 0;
            this.prevPos.y = 0;
          }
        }

        follow(flowfield: p5.Vector[][]) {
          const x = Math.floor(this.pos.x / 20);
          const y = Math.floor(this.pos.y / 20);
          const cols = Math.floor(p.width / 20);
          const rows = Math.floor(p.height / 20);

          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            const force = flowfield[x][y];
            this.acc.add(force);
          }
        }

        show() {
          p.stroke(
            currentHue,
            currentSaturation,
            currentBrightness,
            this.alpha
          );
          p.strokeWeight(currentStrokeWeight);
          p.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
          this.prevPos = this.pos.copy();
        }
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 255);
        p.background(0, 0, 3);

        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle());
        }
      };

      p.draw = () => {
        // Check if sentiment changed
        const currentLabel = sentimentRef.current.label;
        const currentKeywordCount = sentimentRef.current.keywords.length;
        
        if (currentLabel !== lastLabel || currentKeywordCount !== lastKeywordCount) {
          updateVisualization();
          lastLabel = currentLabel;
          lastKeywordCount = currentKeywordCount;
        }
        
        // Smooth lerp to target values
        currentHue = p.lerp(currentHue, targetHue, 0.05);
        currentSaturation = p.lerp(currentSaturation, targetSaturation, 0.05);
        currentBrightness = p.lerp(currentBrightness, targetBrightness, 0.05);
        currentEnergy = p.lerp(currentEnergy, targetEnergy, 0.05);
        currentFlowSpeed = p.lerp(currentFlowSpeed, targetFlowSpeed, 0.05);
        currentStrokeWeight = p.lerp(currentStrokeWeight, targetStrokeWeight, 0.05);

        // Fade effect
        p.fill(0, 0, 3, 10);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // Create flow field
        const cols = Math.floor(p.width / 20);
        const rows = Math.floor(p.height / 20);
        const flowfield: p5.Vector[][] = [];

        for (let x = 0; x < cols; x++) {
          flowfield[x] = [];
          for (let y = 0; y < rows; y++) {
            const angle =
              p.noise(x * noiseScale, y * noiseScale, time) * p.TWO_PI * 4;
            const v = p5.Vector.fromAngle(angle);
            v.setMag(0.5 * currentEnergy);
            flowfield[x][y] = v;
          }
        }

        // Update and draw particles
        for (const particle of particles) {
          particle.follow(flowfield);
          particle.update();
          particle.show();
        }

        time += currentFlowSpeed;
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

  
    const updateVisualization = () => {
      const { label, keywords: kw } = sentimentRef.current;
      console.log("Updating visualization:", label, "Keywords:", kw.length);
      
      if (label === "positive") {
        // POSITIVE MOOD: Bright, warm, energetic
        targetHue = 50;              // Golden yellow/orange
        targetSaturation = 95;       // Vibrant
        targetBrightness = 85;       // Bright
        targetEnergy = 1.8;          // High particle velocity
        targetFlowSpeed = 0.005;     // Fast noise evolution
        targetStrokeWeight = 3.5;    // Thick, bold trails
      } else if (label === "negative") {
        // NEGATIVE MOOD: Dark, cool, slow
        targetHue = 240;             // Deep blue
        targetSaturation = 80;       // Saturated but not bright
        targetBrightness = 30;       // Dark
        targetEnergy = 0.25;         // Low particle velocity
        targetFlowSpeed = 0.0008;    // Very slow noise evolution
        targetStrokeWeight = 1.2;    // Thin, delicate trails
      } else {
        // NEUTRAL MOOD: Calm, balanced
        targetHue = 200;             // Cyan-blue
        targetSaturation = 65;       // Moderate
        targetBrightness = 55;       // Medium
        targetEnergy = 0.7;          // Moderate particle velocity
        targetFlowSpeed = 0.002;     // Medium noise evolution
        targetStrokeWeight = 2;      // Standard trails
      }

    
      if (kw.length > 0) {
        targetEnergy += kw.length * 0.15;      // Each keyword adds motion
        targetStrokeWeight += kw.length * 0.25; // Each keyword thickens trails
      }
    };

    p5InstanceRef.current = new p5(sketch, containerRef.current);
    updateVisualization();

    return () => {
      p5InstanceRef.current?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ touchAction: "none" }}
    />
  );
};
