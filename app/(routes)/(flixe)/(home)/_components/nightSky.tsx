"use client";

import React, { useEffect, useState } from "react";
import Stars from "./stars";

const BACKGROUNDS = [
  "rgba(4, 4, 15, 0.95)",
  "rgba(7, 7, 25, 0.95)",
  "rgba(10, 10, 30, 0.95)",
  "rgba(13, 13, 35, 0.9)",
  "rgba(16, 16, 40, 0.9)",
  "rgba(10, 10, 32, 0.85)",
  "rgba(16, 16, 40, 0.9)",
  "rgba(13, 13, 35, 0.9)",
  "rgba(10, 10, 30, 0.95)",
  "rgba(7, 7, 25, 0.95)",
  "rgba(4, 4, 15, 0.95)",
];

const NightSky: React.FC = () => {
  const [bg, setBg] = useState<number>(0); // Track current background
  const [show, setShow] = useState<boolean>(false); // Used to trigger re-render

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true); // Triggers re-render which might be necessary for Stars or other components
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBg = bg < BACKGROUNDS.length - 1 ? bg + 1 : 0;
      setBg(newBg);
    }, 10000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [bg]);

  return (
    <div
      className={`fixed top-0 w-screen h-screen flex flex-col items-center justify-center transition-all duration-1000`}
      style={{
        background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 90%), ${BACKGROUNDS[bg]}`,
      }}
    >
      <Stars />
    </div>
  );
};

export default NightSky;
