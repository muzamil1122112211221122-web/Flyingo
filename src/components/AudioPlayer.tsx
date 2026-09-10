"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  durationSeconds?: number;
  isMe?: boolean;
}

export default function AudioPlayer({ src, durationSeconds, isMe }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoaded = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      } else if (durationSeconds && durationSeconds > 0) {
        setDuration(durationSeconds);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleRate = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const next = rates[nextIdx];
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 py-1 px-1 min-w-[220px] max-w-[280px]`}>
      {/* Play/Pause Circle */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all shadow-sm ${
          isMe
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-user-gradient text-white hover:opacity-90 shadow-[#003973]/20"
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>

      {/* Progress & Waveform Slider */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Fake decorative waveform bars */}
        <div className="flex items-center gap-0.5 h-4 mb-1">
          {[40, 70, 90, 60, 100, 50, 80, 45, 95, 65, 35, 75, 55, 85, 40, 70, 90, 60].map((h, i) => {
            const barProgress = (i / 18) * 100;
            const isPlayed = barProgress <= progress;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-colors duration-150 ${
                  isMe
                    ? isPlayed
                      ? "bg-white"
                      : "bg-white/35"
                    : isPlayed
                    ? "bg-[#003973]"
                    : "bg-on-surface-variant/25"
                }`}
              />
            );
          })}
        </div>

        {/* Real range input overlaid for scrubbing */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-transparent appearance-none cursor-pointer accent-current opacity-70 hover:opacity-100 transition-opacity"
        />

        <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback speed toggle */}
      <button
        type="button"
        onClick={toggleRate}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
          isMe ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/5 hover:bg-black/10 text-on-surface"
        }`}
        title="Playback Speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
