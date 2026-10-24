"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 48;
// How often a new bar is pushed in from the right — slow enough to read as
// a scrolling history of the voice, not a jittery meter.
const SAMPLE_MS = 80;
const MIN_SCALE = 0.12;

// Live mic level as a right-to-left scrolling bar strip (voice-message
// style), so the user sees the mic is actually picking them up. Bars are
// updated through refs on each animation frame — no React state, so the
// (large) chat component never re-renders at frame rate.
export function RecordingWaveform({
  stream,
  className,
}: {
  stream: MediaStream | null;
  className?: string;
}) {
  const barsRef = React.useRef<(HTMLSpanElement | null)[]>([]);

  React.useEffect(() => {
    if (!stream || typeof window.AudioContext === "undefined") return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const samples = new Uint8Array(analyser.fftSize);
    const levels = new Array<number>(BAR_COUNT).fill(MIN_SCALE);
    let frame = 0;
    let lastSampleAt = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastSampleAt < SAMPLE_MS) return;
      lastSampleAt = now;

      analyser.getByteTimeDomainData(samples);
      let sumSquares = 0;
      for (const sample of samples) {
        const centered = (sample - 128) / 128;
        sumSquares += centered * centered;
      }
      // RMS of normal speech sits around 0.05–0.2 — boosted so it fills the strip.
      const level = Math.min(1, Math.sqrt(sumSquares / samples.length) * 5);
      levels.shift();
      levels.push(Math.max(MIN_SCALE, level));
      levels.forEach((value, index) => {
        const bar = barsRef.current[index];
        if (bar) bar.style.transform = `scaleY(${value})`;
      });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
    };
  }, [stream]);

  return (
    <div
      aria-hidden
      className={cn("flex h-7 items-center justify-end gap-0.5 overflow-hidden", className)}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          ref={(element) => {
            barsRef.current[index] = element;
          }}
          style={{ transform: `scaleY(${MIN_SCALE})` }}
          className="h-full w-0.75 shrink-0 rounded-full bg-destructive/70 transition-transform duration-75"
        />
      ))}
    </div>
  );
}
