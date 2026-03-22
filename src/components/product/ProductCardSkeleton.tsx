"use client";

import { motion, Variants } from "framer-motion";

interface ProductCardSkeletonProps {
    className?: string;
}

export default function ProductCardSkeleton({ className = "" }: ProductCardSkeletonProps) {
    const shimmerVariants: Variants = {
        initial: { opacity: 0.3 },
        animate: {
            opacity: [0.3, 0.5, 0.3],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut" as const,
            },
        },
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            className={`hasbro-card flex flex-col h-full bg-[#0a0a0a] overflow-hidden ${className}`}
        >
            {/* Image placeholder */}
            <div className="relative aspect-[4/5] bg-[#111] overflow-hidden">
                <motion.div
                    variants={shimmerVariants}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
                {/* Rating placeholder */}
                <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={shimmerVariants}
                            className="w-2.5 h-2.5 rounded-full bg-[#222]"
                        />
                    ))}
                </div>

                {/* Tags placeholder */}
                <div className="flex gap-2 mb-2">
                    <motion.div
                        variants={shimmerVariants}
                        className="h-3 w-12 bg-[#1a1a1a] rounded-sm"
                    />
                    <motion.div
                        variants={shimmerVariants}
                        className="h-3 w-16 bg-[#1a1a1a] rounded-sm"
                    />
                </div>

                {/* Title placeholder */}
                <div className="mb-2">
                    <motion.div
                        variants={shimmerVariants}
                        className="h-6 w-3/4 bg-[#1a1a1a] rounded-sm mb-1"
                    />
                    <motion.div
                        variants={shimmerVariants}
                        className="h-6 w-1/2 bg-[#1a1a1a] rounded-sm"
                    />
                </div>

                {/* Description placeholder */}
                <div className="flex-1 mb-6">
                    <motion.div
                        variants={shimmerVariants}
                        className="h-4 w-full bg-[#151515] rounded-sm mb-2"
                    />
                    <motion.div
                        variants={shimmerVariants}
                        className="h-4 w-2/3 bg-[#151515] rounded-sm"
                    />
                </div>

                {/* Price and button placeholder */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                        <motion.div
                            variants={shimmerVariants}
                            className="h-3 w-20 bg-[#1a1a1a] rounded-sm mb-1"
                        />
                        <motion.div
                            variants={shimmerVariants}
                            className="h-8 w-24 bg-[#1a1a1a] rounded-sm"
                        />
                    </div>
                    <motion.div
                        variants={shimmerVariants}
                        className="w-12 h-12 bg-[#1a1a1a] rounded"
                    />
                </div>
            </div>
        </motion.div>
    );
}

// Grid of skeletons for loading states
interface ProductGridSkeletonProps {
    count?: number;
}

export function ProductGridSkeleton({ count = 3 }: ProductGridSkeletonProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(count)].map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
