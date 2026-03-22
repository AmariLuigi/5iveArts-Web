"use client";

import { useCallback, useRef, EffectCallback } from "react";
import { useCounter } from "@/hooks/useCounter";
import { motion, Variants } from "framer-motion";

interface AnimatedCounterProps {
    end: number;
    start?: number;
    duration?: number;
    delay?: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
    separator?: string;
    className?: string;
    autoStart?: boolean;
    // Animation variants
    once?: boolean;
    direction?: "up" | "down";
}

export default function AnimatedCounter({
    end,
    start = 0,
    duration = 2000,
    delay = 0,
    decimals = 0,
    suffix = "",
    prefix = "",
    separator = ",",
    className = "",
    autoStart = true,
    once = true,
    direction = "up",
}: AnimatedCounterProps) {
    const { formattedValue, isInView, setElement } = useCounter({
        start,
        end,
        duration,
        delay,
        decimals,
        suffix,
        prefix,
        separator,
        autoStart: false, // We control start with intersection observer
    });

    // Proper callback ref to avoid type issues
    const refCallback = useCallback((el: HTMLElement | null) => {
        setElement(el);
    }, [setElement]);

    const variants: Variants = {
        hidden: {
            opacity: 0,
            y: direction === "up" ? 20 : -20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay: delay / 1000,
            },
        },
    };

    return (
        <motion.span
            ref={refCallback}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            className={className}
        >
            {formattedValue}
        </motion.span>
    );
}

// Animated counter with Framer Motion's useMotionValue
interface MotionCounterProps {
    value: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

export function MotionCounter({
    value,
    className = "",
    suffix = "",
    prefix = "",
}: MotionCounterProps) {
    return (
        <motion.span
            className={className}
            // Use framer motion's animate for simple number display
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {prefix}
            {value.toLocaleString()}
            {suffix}
        </motion.span>
    );
}
