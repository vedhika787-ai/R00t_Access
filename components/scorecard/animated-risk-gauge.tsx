"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { TrendingDown, Shield } from "lucide-react";

interface AnimatedRiskGaugeProps {
  score: number;
  originalScore?: number;
  level: string;
}

export function AnimatedRiskGauge({
  score,
  originalScore,
  level,
}: AnimatedRiskGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animated spring for the score counter
  const springScore = useSpring(0, { stiffness: 60, damping: 15 });

  useEffect(() => {
    springScore.set(score);
    const unsubscribe = springScore.on("change", (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return () => unsubscribe();
  }, [score, springScore]);

  // Semicircle parameters
  const radius = 88;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGaugeColors = (val: number) => {
    if (val >= 75) {
      return {
        stroke: "#DC2626",
        text: "text-red-600 dark:text-red-400",
        bgTint: "bg-red-500/10",
        label: "Critical Exposure",
      };
    }
    if (val >= 50) {
      return {
        stroke: "#EA580C",
        text: "text-orange-600 dark:text-orange-400",
        bgTint: "bg-orange-500/10",
        label: "High Risk",
      };
    }
    if (val >= 25) {
      return {
        stroke: "#D97706",
        text: "text-amber-600 dark:text-amber-400",
        bgTint: "bg-amber-500/10",
        label: "Medium Risk",
      };
    }
    return {
      stroke: "#16A34A",
      text: "text-emerald-600 dark:text-emerald-400",
      bgTint: "bg-emerald-500/10",
      label: "Low Risk",
    };
  };

  const colors = getGaugeColors(score);
  const delta = originalScore !== undefined && originalScore > score ? originalScore - score : 0;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 text-center">
      {/* SVG Arc Gauge */}
      <div className="relative w-56 h-32 flex items-center justify-center">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full overflow-visible"
        >
          {/* Background Track Arc */}
          <path
            d="M 12 100 A 88 88 0 0 1 188 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted/60"
          />

          {/* Animated Value Arc */}
          <motion.path
            d="M 12 100 A 88 88 0 0 1 188 100"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${colors.stroke}50)`,
            }}
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className={`text-5xl font-extrabold tracking-tight ${colors.text}`}>
            {displayScore}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono font-medium -mt-1">
            out of 100
          </span>
        </div>
      </div>

      {/* Exposure Level Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bgTint} ${colors.text} border border-current/20`}
        >
          {level || colors.label}
        </span>
      </div>

      {/* Floating Delta Badge when redlines are accepted */}
      {delta > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>-{delta} pts resolved by redlines</span>
        </motion.div>
      )}
    </div>
  );
}
