"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

export default function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(true);
    const [cursorType, setCursorType] = useState<'default' | 'magnifier'>('default');

    // Refs for state comparison to prevent redundant re-renders
    const stateRef = useRef({
        isHovering: false,
        cursorType: 'default' as 'default' | 'magnifier',
        isVisible: false
    });

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
            if (!stateRef.current.isVisible) {
                stateRef.current.isVisible = true;
                setIsVisible(true);
            }
        };

        const handleMouseDown = () => setIsPressed(true);
        const handleMouseUp = () => setIsPressed(false);

        const handleLinkHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const container = target.closest('button, a, .interactive-cursor, input, select, textarea, .cursor-zoom-in');
            
            const newIsHovering = !!container;
            const newCursorType = container?.classList.contains('cursor-zoom-in') ? 'magnifier' : 'default';

            if (newIsHovering !== stateRef.current.isHovering) {
                stateRef.current.isHovering = newIsHovering;
                setIsHovering(newIsHovering);
            }

            if (newCursorType !== stateRef.current.cursorType) {
                stateRef.current.cursorType = newCursorType;
                setCursorType(newCursorType);
            }
        };

        window.addEventListener("mousemove", moveCursor, { passive: true });
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleLinkHover, { passive: true });

        return () => {
            document.body.classList.remove('has-custom-cursor');
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleLinkHover);
        };
    }, []); // Removed isVisible to prevent listener re-attachment leaks

    if (isMobile) return null;

    return (
        <div className="hidden lg:block">
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
                    opacity: isVisible ? (cursorType === 'magnifier' ? 0 : 1) : 0
                }}
            />

            {/* The Outer Ring */}
            <motion.div
                className="fixed top-0 left-0 border border-brand-yellow/30 rounded-full pointer-events-none z-[9998] flex items-center justify-center overflow-hidden"
                style={{
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    width: cursorType === 'magnifier' ? 64 : (isHovering ? 44 : 16),
                    height: cursorType === 'magnifier' ? 64 : (isHovering ? 44 : 16),
                    scale: isPressed ? 0.8 : 1,
                    backgroundColor: cursorType === 'magnifier' ? "rgba(255, 215, 0, 0.1)" : (isHovering ? "rgba(255, 215, 0, 0.05)" : "transparent"),
                    borderColor: cursorType === 'magnifier' ? "rgba(255, 215, 0, 0.8)" : (isHovering ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 215, 0, 0.2)"),
                    opacity: isVisible ? 1 : 0
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    backgroundColor: { duration: 0.2 }
                }}
            >
                <AnimatePresence>
                    {cursorType === 'magnifier' && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="text-brand-yellow"
                        >
                            <Search className="w-5 h-5 stroke-[3]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
