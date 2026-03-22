"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  duration?: number;
  distance?: number;
  easing?: "easeOut" | "easeIn" | "easeInOut" | [number, number, number, number];
  once?: boolean;
  margin?: string;
  className?: string;
}

const easingMap = {
  easeOut: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
  easeIn: [0.55, 0.055, 0.675, 0.19] as [number, number, number, number],
  easeInOut: [0.645, 0.045, 0.355, 1] as [number, number, number, number],
};

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  duration = 0.8,
  distance = 40,
  easing = "easeOut",
  once = true,
  margin = "-100px",
  className = "",
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { y: 0, x: distance };
      case "right":
        return { y: 0, x: -distance };
      case "none":
        return { y: 0, x: 0 };
    }
  };

  const getEasing = (): [number, number, number, number] => {
    if (Array.isArray(easing)) return easing;
    return easingMap[easing] || easingMap.easeOut;
  };

  const initial = {
    opacity: 0,
    ...getInitialPosition(),
  };

  const variants: Variants = {
    hidden: initial,
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        ease: getEasing(),
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered container for reveal children with delay
interface StaggerRevealProps {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
}

export function StaggerReveal({
  children,
  staggerDelay = 0.15,
  delayChildren = 0,
  className = "",
}: StaggerRevealProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}

export function StaggerItem({
  children,
  className = "",
  variants,
}: StaggerItemProps) {
  const defaultVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      variants={variants || defaultVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale reveal variant
interface ScaleRevealProps {
  children: ReactNode;
  delay?: number;
  scale?: number;
  className?: string;
}

export function ScaleReveal({
  children,
  delay = 0,
  scale = 0.9,
  className = "",
}: ScaleRevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, scale },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
