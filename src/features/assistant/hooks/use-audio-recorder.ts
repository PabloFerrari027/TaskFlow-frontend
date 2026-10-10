"use client";

import * as React from "react";
import { ASSISTANT_ATTACHMENT_MAX_AUDIO_SECONDS } from "@/features/assistant/lib/attachment-limits";

export type AudioRecorderStatus = "idle" | "starting" | "recording";

export type AudioRecorderError = "unsupported" | "denied" | "too-short";

// Anything shorter is almost always a misclick — the server would answer it
// with ASSISTANT_EMPTY_TRANSCRIPTION anyway.
const MIN_RECORDING_MS = 1000;
// Plenty for speech, and keeps a full-length clip well under the 14MB
// per-message cap (browsers default to ~128kbps).
const AUDIO_BITS_PER_SECOND = 32_000;

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

// Records one clip at a time via MediaRecorder and hands it back as a File
// through `onRecorded` — staging/removal is the caller's job (same chip list
// as a picked file), this hook only owns mic access and the recording itself.
// Failures go to `onError` on every attempt (not as a status), so a second
// click after a denied permission still tells the user why nothing happened.
export function useAudioRecorder(
  onRecorded: (file: File) => void,
  onError: (error: AudioRecorderError) => void
) {
  const [status, setStatus] = React.useState<AudioRecorderStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Set right before a stop that must NOT hand back a file (composer closed
  // mid-recording) — `onstop` still fires either way, this just tells it to
  // drop the clip instead of calling `onRecorded` (which auto-sends).
  const discardRef = React.useRef(false);
  // Also bumped by `cancel`, so a `start` still waiting on the mic permission
  // prompt knows it was cancelled and releases the stream it gets.
  const attemptRef = React.useRef(0);
  const onRecordedRef = React.useRef(onRecorded);
  const onErrorRef = React.useRef(onError);
  React.useLayoutEffect(() => {
    onRecordedRef.current = onRecorded;
    onErrorRef.current = onError;
  });

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
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    setStatus("idle");
  }, [stopTimer]);

  const cancel = React.useCallback(() => {
    attemptRef.current += 1;
    discardRef.current = recorderRef.current?.state === "recording";
    stop();
  }, [stop]);

  async function start() {
    // A second click while the permission prompt is open (or while
    // recording) would otherwise open a second mic stream nobody stops.
    if (status !== "idle") return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onErrorRef.current("unsupported");
      return;
    }

    const attempt = ++attemptRef.current;
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (attempt === attemptRef.current) {
        setStatus("idle");
        onErrorRef.current("denied");
      }
      return;
    }
    if (attempt !== attemptRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { audioBitsPerSecond: AUDIO_BITS_PER_SECOND });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setStatus("idle");
      onErrorRef.current("unsupported");
      return;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    // Per recording, not a shared ref: a new clip started right after a stop
    // must not wipe the chunks the previous `onstop` is about to read.
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (discardRef.current) {
        discardRef.current = false;
        return;
      }
      const mimeType = recorder.mimeType || chunks[0]?.type || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0 || Date.now() - startedAt < MIN_RECORDING_MS) {
        onErrorRef.current("too-short");
        return;
      }
      onRecordedRef.current(
        new File([blob], `gravacao-${Date.now()}.${extensionFor(mimeType)}`, { type: mimeType })
      );
    };

    recorder.start();
    setStatus("recording");
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= ASSISTANT_ATTACHMENT_MAX_AUDIO_SECONDS) stop();
    }, 1000);
  }

  React.useEffect(() => {
    return () => {
      stopTimer();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  return { status, seconds, start, stop, cancel };
}
