"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(true);

    // Precise coordinates
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Spring physics for the ring (lag effect)
    const springConfig = { damping: 25, stiffness: 250 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        // Only run on desktop with a mouse
        const checkMobile = () => {
            const mobile = window.matchMedia("(pointer: coarse)").matches;
            setIsMobile(mobile);
            if (!mobile) document.body.classList.add('has-custom-cursor');
        };
        checkMobile();

        const moveCursor = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseDown = () => setIsPressed(true);
        const handleMouseUp = () => setIsPressed(false);

        const handleLinkHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Precise detection: only trigger if hovering a clickable element
            const isInteractive = target.closest('button, a, .interactive-cursor, input, select, textarea');
            setIsHovering(!!isInteractive);
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleLinkHover);

        return () => {
            document.body.classList.remove('has-custom-cursor');
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleLinkHover);
        };
    }, [isVisible]);

    if (isMobile) return null;

    return (
        <>
            {/* The Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-brand-yellow rounded-full pointer-events-none z-[9999]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isPressed ? 0.5 : 1,
                    opacity: isVisible ? 1 : 0
                }}
            />

            {/* The Outer Ring */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border border-brand-yellow/30 rounded-full pointer-events-none z-[9998]"
                style={{
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 1.5 : (isPressed ? 0.8 : 1),
                    backgroundColor: isHovering ? "rgba(255, 215, 0, 0.05)" : "transparent",
                    borderColor: isHovering ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 215, 0, 0.2)",
                    opacity: isVisible ? 1 : 0
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }}
            />
        </>
    );
}
