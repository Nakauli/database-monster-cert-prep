"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  suffix?: string;
  color?: string;
}

export function ProgressRing({
  value,
  size = 132,
  stroke = 10,
  label,
  suffix = "%",
  color = "var(--green)",
}: ProgressRingProps) {
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(reduce ? value : 0);
  const display = useTransform(progress, (v) => Math.round(v));
  const offset = useTransform(progress, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    if (reduce) {
      progress.set(value);
      return;
    }
    const controls = animate(progress, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, reduce, progress]);

  return (
    <div className="readiness-dial" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="dial-val">
        <strong>
          <motion.span>{display}</motion.span>
          {suffix}
        </strong>
        {label && <small>{label}</small>}
      </div>
    </div>
  );
}
