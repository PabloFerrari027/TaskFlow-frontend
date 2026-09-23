"use client";

import * as React from "react";
import { ASSISTANT_ATTACHMENT_MAX_AUDIO_SECONDS } from "@/features/assistant/lib/attachment-limits";

export type AudioRecorderStatus = "idle" | "recording" | "unsupported" | "denied";

// Records one clip at a time via MediaRecorder and hands it back as a File
// through `onRecorded` — staging/removal is the caller's job (same chip list
// as a picked file), this hook only owns mic access and the recording itself.
export function useAudioRecorder(onRecorded: (file: File) => void) {
  const [status, setStatus] = React.useState<AudioRecorderStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Set right before a stop that must NOT hand back a file (composer closed
  // mid-recording) — `onstop` still fires either way, this just tells it to
  // drop the clip instead of calling `onRecorded` (which now auto-sends).
  const discardRef = React.useRef(false);

  const stopTimer = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const releaseStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = React.useCallback(() => {
    stopTimer();
    recorderRef.current?.stop();
    setStatus("idle");
  }, [stopTimer]);

  const cancel = React.useCallback(() => {
    discardRef.current = true;
    stopTimer();
    recorderRef.current?.stop();
    setStatus("idle");
  }, [stopTimer]);

  async function start() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        releaseStream();
        if (discardRef.current) {
          discardRef.current = false;
          return;
        }
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "m4a" : "webm";
        onRecorded(new File([blob], `gravacao-${Date.now()}.${extension}`, { type: mimeType }));
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);
      intervalRef.current = setInterval(() => {
        setSeconds((previous) => {
          const next = previous + 1;
          if (next >= ASSISTANT_ATTACHMENT_MAX_AUDIO_SECONDS) stop();
          return next;
        });
      }, 1000);
    } catch {
      setStatus("denied");
    }
  }

  React.useEffect(() => {
    return () => {
      stopTimer();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  return { status, seconds, start, stop, cancel };
}
