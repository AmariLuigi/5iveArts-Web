"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ParallaxOptions {
    intensity?: number;
    throttle?: number;
    disabled?: boolean;
}

export function useParallax(options: ParallaxOptions = {}) {
    const { intensity = 20, throttle = 16, disabled = false } = options;
    const elementRef = useRef<HTMLElement | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const lastUpdateRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (disabled) return;

            const now = Date.now();
            if (now - lastUpdateRef.current < throttle) return;
            lastUpdateRef.current = now;

            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (typeof window !== 'undefined' ? window.innerWidth / 2 : 1);
            const deltaY = (e.clientY - centerY) / (typeof window !== 'undefined' ? window.innerHeight / 2 : 1);

            setOffset({
                x: deltaX * intensity,
                y: deltaY * intensity,
            });
        },
        [intensity, throttle, disabled]
    );

    useEffect(() => {
        if (disabled) return;

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [handleMouseMove, disabled]);

    const setElement = useCallback((el: HTMLElement | null) => {
        elementRef.current = el;
    }, []);

    return { ref: setElement, offset };
}

interface ScrollParallaxOptions {
    speed?: number;
    direction?: "up" | "down";
    disabled?: boolean;
}

export function useScrollParallax(options: ScrollParallaxOptions = {}) {
    const { speed = 0.5, direction = "down", disabled = false } = options;
    const elementRef = useRef<HTMLElement | null>(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (disabled) return;

        const handleScroll = () => {
            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            const elementTop = rect.top;
            const viewportHeight = window.innerHeight;

            // Calculate progress through the viewport (0 to 1)
            const progress = (viewportHeight - elementTop) / (viewportHeight + rect.height);
            const clampedProgress = Math.max(0, Math.min(1, progress));

            const offset = direction === "down"
                ? clampedProgress * rect.height * speed
                : -clampedProgress * rect.height * speed;

            setScrollY(offset);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial calculation

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [speed, direction, disabled]);

    const setElement = useCallback((el: HTMLElement | null) => {
        elementRef.current = el;
    }, []);

    return { ref: setElement, scrollY };
}
