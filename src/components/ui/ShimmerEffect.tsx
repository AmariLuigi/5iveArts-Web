"use client";

import { motion, Variants, useAnimation, useInView } from "framer-motion";
import { useRef } from "react";

interface ShimmerEffectProps {
    className?: string;
    duration?: number;
    delay?: number;
}

export default function ShimmerEffect({
    className = "",
    duration = 1.5,
    delay = 0,
}: ShimmerEffectProps) {
    return (
        <motion.div
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`}
            initial={{ x: "-100%", opacity: 0.5 }}
            animate={{ x: "200%", opacity: 0 }}
            transition={{
                duration,
                delay,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 2,
            }}
        />
    );
}

// Shimmer overlay that triggers when parent is hovered
interface HoverShimmerProps {
    className?: string;
    duration?: number;
}

export function HoverShimmer({ className = "", duration = 0.8 }: HoverShimmerProps) {
    const controls = useAnimation();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false });

    const startShimmer = () => {
        controls.start({
            x: ["-100%", "100%"],
            opacity: [0, 0.5, 0],
            transition: {
                duration,
                ease: "easeOut",
            },
        });
    };

    return (
        <div ref={ref} className="relative overflow-hidden">
            <motion.div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent ${className}`}
                initial={{ x: "-100%", opacity: 0 }}
                animate={controls}
                onMouseEnter={startShimmer}
            />
        </div>
    );
}

// Card shine effect for product cards
interface CardShineProps {
    isActive?: boolean;
}

export function CardShine({ isActive = false }: CardShineProps) {
    const shineVariants: Variants = {
        initial: { x: "-100%", opacity: 0 },
        animate: {
            x: ["-100%", "100%"],
            opacity: [0, 0.3, 0],
            transition: {
                duration: 0.8,
                ease: "easeOut" as const,
            },
        },
        hover: {
            x: ["-100%", "100%"],
            opacity: [0, 0.4, 0],
            transition: {
                duration: 0.7,
                ease: "easeOut" as const,
            },
        },
    };

    return (
        <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            variants={shineVariants}
            initial="initial"
            whileHover="hover"
            style={{
                background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)",
                backgroundSize: "200% 100%",
            }}
        />
    );
}
