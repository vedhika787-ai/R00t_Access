"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // default 8deg
  glare?: boolean;
  onClick?: () => void;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for fluid motion
  const mouseXSpring = useSpring(x, { stiffness: 250, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 250, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  if (reducedMotion) {
    return (
      <div
        className={`rounded-2xl border border-border/80 bg-surface shadow-soft transition-all duration-200 hover:border-brand-primary/40 ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border border-border/80 bg-surface shadow-soft transition-shadow hover:shadow-raised duration-200 overflow-hidden ${className}`}
    >
      {/* Moving Specular Glare */}
      {glare && isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-full opacity-20 dark:opacity-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 250px at ${glareX} ${glareY}, rgba(255,255,255,0.8), transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
