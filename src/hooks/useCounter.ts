"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CounterOptions {
    start?: number;
    end: number;
    duration?: number;
    delay?: number;
    decimals?: number;
    easing?: boolean;
    suffix?: string;
    prefix?: string;
    separator?: string;
    autoStart?: boolean;
}

export function useCounter(options: CounterOptions) {
    const {
        start = 0,
        end,
        duration = 2000,
        delay = 0,
        decimals = 0,
        easing = true,
        suffix = "",
        prefix = "",
        separator = ",",
        autoStart = true,
    } = options;

    const [count, setCount] = useState(start);
    const [isInView, setIsInView] = useState(autoStart);
    const [hasStarted, setHasStarted] = useState(false);
    const elementRef = useRef<HTMLElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
    };

    const animate = useCallback(() => {
        const startVal = start;
        const endVal = end;
        const totalDuration = duration;

        const step = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / totalDuration, 1);

            const easedProgress = easing ? easeOutCubic(progress) : progress;
            const currentValue = startVal + (endVal - startVal) * easedProgress;

            setCount(currentValue);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);
    }, [start, end, duration, easing]);

    useEffect(() => {
        if (!isInView) return;

        const timeout = setTimeout(() => {
            setHasStarted(true);
            startTimeRef.current = null;
            animate();
        }, delay);

        return () => {
            clearTimeout(timeout);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isInView, delay, animate]);

    // Intersection observer for auto-start when in view
    useEffect(() => {
        if (!autoStart && elementRef.current) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsInView(true);
                        }
                    });
                },
                { threshold: 0.3 }
            );

            observer.observe(elementRef.current);

            return () => {
                observer.disconnect();
            };
        }
    }, [autoStart]);

    const setElement = useCallback((el: HTMLElement | null) => {
        elementRef.current = el;
    }, []);

    // Format number with separator
    const formatNumber = useCallback(
        (num: number): string => {
            const fixedNum = Number(num.toFixed(decimals));
            const parts = fixedNum.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
            return parts.join(".");
        },
        [decimals, separator]
    );

    const formattedValue = `${prefix}${formatNumber(count)}${suffix}`;

    return {
        count,
        formattedValue,
        setElement,
        isInView,
        setIsInView,
        hasStarted,
    };
}

// Hook for counting with scroll progress
export function useScrollCounter(options: Omit<CounterOptions, "autoStart"> & {
    scrollMultiplier?: number
}) {
    const { scrollMultiplier = 1, ...counterOptions } = options;
    const [scrollProgress, setScrollProgress] = useState(0);
    const elementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const elementTop = rect.top;

            // Calculate progress (0 when element enters viewport, 1 when it leaves)
            const progress = Math.max(0, Math.min(1,
                (viewportHeight - elementTop) / (viewportHeight + rect.height)
            ));

            setScrollProgress(progress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const animatedEnd = counterOptions.end * scrollProgress * scrollMultiplier;

    const counter = useCounter({
        ...counterOptions,
        end: animatedEnd,
        autoStart: true,
    });

    return {
        ...counter,
        scrollProgress,
        ref: (el: HTMLElement | null) => {
            elementRef.current = el;
            counter.setElement(el);
        },
    };
}
