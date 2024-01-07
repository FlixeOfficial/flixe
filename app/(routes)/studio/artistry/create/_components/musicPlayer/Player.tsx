"use client";

import React, { useState, useRef, useEffect } from "react";
import { Pause, Play } from "lucide-react";
import "./Player.css";

type VinylPlayerProps = {
  coverImage: string;
  musicSrc: string;
};

const VinylPlayer: React.FC<VinylPlayerProps> = ({ coverImage, musicSrc }) => {
  console.log("coverImage", coverImage);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio(musicSrc);
  }, [musicSrc]);

  useEffect(() => {
    audioRef.current = new Audio(musicSrc);
    audioRef.current.ontimeupdate = () =>
      setCurrentTime(audioRef.current?.currentTime || 0);
  }, [musicSrc]);

  useEffect(() => {
    audioRef.current = new Audio(musicSrc);
    audioRef.current.ontimeupdate = () =>
      setCurrentTime(audioRef.current?.currentTime || 0);
    audioRef.current.onloadedmetadata = () =>
      setDuration(audioRef.current?.duration || 0);
  }, [musicSrc]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div id="player-wrapper" className="player-wrapper-class">
      <div id="vinyl-container" className="vinyl-container-class">
        <div
          id="vinyl-cover"
          className="vinyl-cover-class flex flex-col justify-between items-center group z-10 rounded-xl overflow-hidden"
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          <div
            className="play-pause-container flex justify-center items-center h-4/5 w-full z-20"
            onClick={togglePlayPause}
          >
            <div className="bg-primary/30 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-lg group-hover:opacity-50 group-hover:hover:opacity-100 opacity-0 transition-opacity duration-300 mt-[15%]">
              {isPlaying ? (
                <Pause className="block" />
              ) : (
                <Play className="block" />
              )}
            </div>
          </div>
          <div className="progress-bar-container flex justify-center items-center h-1/5 w-full z-30 group-hover:opacity-50 group-hover:hover:opacity-100 opacity-0 transition-opacity duration-300 mb-[10%]">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                if (audioRef.current) {
                  audioRef.current.currentTime = newTime;
                }
                setCurrentTime(newTime);
              }}
            />
          </div>
        </div>
        <div className={`vinyl-record ${isPlaying ? "" : "paused"}`}></div>
      </div>
    </div>
  );
};

export default VinylPlayer;
