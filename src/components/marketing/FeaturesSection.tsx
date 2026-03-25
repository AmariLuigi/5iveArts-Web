"use client";

import { type ReactNode, useRef } from "react";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { useCounter } from "@/hooks/useCounter";
import { StatItem } from "@/lib/settings";

export interface Feature {
  icon: ReactNode;
  title: string;
  text: string;
}

export interface FeaturesSectionProps {
  features: Feature[];
  dict?: {
    homepage?: {
      collectorsVault?: string;
      satisfactionRate?: string;
      countriesServed?: string;
      yearsExperience?: string;
    };
  };
  stats?: {
    collectorsVault?: StatItem;
    satisfactionRate?: StatItem;
    countriesServed?: StatItem;
    yearsExperience?: StatItem;
  };
}

interface AnimatedStat {
  value: number;
  suffix?: string;
  label: string;
}

// Default stats values and labels with English fallbacks
const DEFAULT_STATS: AnimatedStat[] = [
  { value: 5000, suffix: "+", label: "Collector's Vault" },
  { value: 99, suffix: "%", label: "Satisfaction Rate" },
  { value: 50, suffix: "+", label: "Countries Served" },
  { value: 15, suffix: "+", label: "Years Experience" },
];

function AnimatedStatCounter({
  value,
  suffix = "",
  label
}: AnimatedStat) {
  const { formattedValue, setElement, isInView } = useCounter({
    start: 0,
    end: value,
    duration: 2000,
    delay: 0,
    suffix,
    autoStart: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        setElement(el);
      }}
      className="flex flex-col items-center text-center p-6 glass rounded-2xl border border-white/5 glow-shadow-yellow group"
    >
      <motion.span
        className="text-4xl md:text-5xl font-black text-brand-yellow mb-2 drop-shadow-[0_0_15px_rgba(255,159,0,0.3)]"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {formattedValue}
      </motion.span>
      <span className="text-[9px] uppercase font-black text-white/50 tracking-[0.3em] group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
  );
}

export default function FeaturesSection({ features, dict, stats: settingsStats }: FeaturesSectionProps) {
  // Build stats with settings, dict, and fallback support
  const stats: AnimatedStat[] = [
    {
      value: settingsStats?.collectorsVault?.value || DEFAULT_STATS[0].value,
      suffix: settingsStats?.collectorsVault?.suffix || DEFAULT_STATS[0].suffix,
      label: dict?.homepage?.collectorsVault || DEFAULT_STATS[0].label
    },
    {
      value: settingsStats?.satisfactionRate?.value || DEFAULT_STATS[1].value,
      suffix: settingsStats?.satisfactionRate?.suffix || DEFAULT_STATS[1].suffix,
      label: dict?.homepage?.satisfactionRate || DEFAULT_STATS[1].label
    },
    {
      value: settingsStats?.countriesServed?.value || DEFAULT_STATS[2].value,
      suffix: settingsStats?.countriesServed?.suffix || DEFAULT_STATS[2].suffix,
      label: dict?.homepage?.countriesServed || DEFAULT_STATS[2].label
    },
    {
      value: settingsStats?.yearsExperience?.value || DEFAULT_STATS[3].value,
      suffix: settingsStats?.yearsExperience?.suffix || DEFAULT_STATS[3].suffix,
      label: dict?.homepage?.yearsExperience || DEFAULT_STATS[3].label
    },
  ];
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  // Parallax transform for the entire features grid
  const featuresY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <section ref={sectionRef} className="relative py-32 px-4 bg-[#050505] border-b border-[#111] overflow-hidden">
      {/* Premium Background Layer */}
      <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent" />
      
      {/* Accessibility: Sequential heading hierarchy */}
      <h2 className="sr-only">Our Core Features and Global Statistics</h2>
      
      {/* Animated stats section */}
      <div className="max-w-7xl mx-auto mb-24 relative z-10">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <AnimatedStatCounter {...stat} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Feature cards with parallax */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{ y: featuresY }}
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10"
      >
        {features.map((f, index) => (
          <motion.div
            key={f.title}
            variants={itemVariants}
            className="flex flex-col items-center text-center group glass p-10 rounded-[2rem] border border-white/5 hover:border-brand-yellow/30 transition-all duration-700 glow-shadow-yellow hover:-translate-y-3 relative overflow-hidden"
          >
            {/* Elegant Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <motion.div
              className="mb-8 p-5 bg-black/40 rounded-2xl border border-white/10 group-hover:border-brand-yellow/40 transition-all duration-500 relative overflow-hidden ring-4 ring-transparent group-hover:ring-brand-yellow/5"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at center, rgba(255,159,0,0.2) 0%, transparent 70%)",
                }}
              />
              <motion.div
                className="transform transition-transform duration-500 group-hover:scale-110 relative z-10"
              >
                {f.icon}
              </motion.div>
            </motion.div>
            
            <h3 className="font-black uppercase tracking-[0.2em] text-[11px] mb-4 text-white group-hover:text-brand-yellow transition-colors duration-300">
              <span className="block mb-1 opacity-40 text-[9px] font-bold">Featured Protocol</span>
              {f.title}
            </h3>
            
            <p className="text-[12px] text-neutral-400 font-medium leading-relaxed max-w-[200px] group-hover:text-neutral-200 transition-colors">
              {f.text}
            </p>

            {/* Visual indicator line */}
            <div className="mt-8 w-8 h-px bg-white/10 group-hover:w-16 group-hover:bg-brand-yellow transition-all duration-700" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
