"use client";

import React, { useRef, useEffect } from "react";


interface ContractsHeroProps {
  onUploadClick?: () => void;
  onLoadSample?: () => void;
  isUploading?: boolean;
}

export function ContractsHero({
  onUploadClick,
  onLoadSample,
  isUploading = false,
}: ContractsHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee seamless background video autoplay on loop and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch((err) => {
        console.log("Background video autoplay:", err);
      });
    }
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 text-white shadow-2xl border-b border-slate-800 aspect-[16/9] min-h-[440px] max-h-[620px] flex items-end">
      {/* Background Video Covering Entire Hero Section - 16:9 Aspect Ratio, Crystal Clear */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        aria-hidden="true"
      >
        <source src="/hero-section-video.mp4" type="video/mp4" />
        <source src="/hero section video.mp4" type="video/mp4" />
      </video>

      {/* Subtle Bottom Gradient Scrim to Ensure Text Readability While Leaving the Video Completely Clear */}
      <div className="absolute inset-x-0 bottom-0 h-44 sm:h-56 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

      {/* Foreground Hero Content Positioned Cleanly at the Bottom within site container alignment */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-8 sm:pb-12">
        {/* Enterprise Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/20 backdrop-blur-md text-xs font-medium text-slate-200 shadow-md mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-[11px] tracking-wider text-indigo-300 font-semibold uppercase">
            LEXIGUARD CONTRACT INTELLIGENCE
          </span>
          <span className="text-white/30">|</span>
          <span className="text-slate-300">Live AI Vector Analysis</span>
        </div>

        {/* Hero Title at the Bottom of Video */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.18] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] max-w-3xl">
          Enterprise Contract Risk &amp; Autonomous Redline Hub
        </h1>
      </div>
    </div>
  );
}
