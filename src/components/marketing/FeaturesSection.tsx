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
      className="flex flex-col items-center text-center"
    >
      <motion.span
        className="text-4xl md:text-5xl font-black text-brand-yellow mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {formattedValue}
      </motion.span>
      <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">
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

  // Parallax transforms for each feature card
  const card1Y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const card2Y = useTransform(scrollYProgress, [0, 1], [20, -30]);
  const card3Y = useTransform(scrollYProgress, [0, 1], [-10, -40]);
  const card4Y = useTransform(scrollYProgress, [0, 1], [-40, -60]);

  const cardTransforms = [card1Y, card2Y, card3Y, card4Y];

  return (
    <section ref={sectionRef} className="relative py-24 px-4 bg-[#050505] border-b border-[#111] overflow-hidden">
      {/* Animated stats section */}
      <div className="max-w-7xl mx-auto mb-20 pb-10 border-b border-white/5">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
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
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12"
      >
        {features.map((f, index) => (
          <motion.div
            key={f.title}
            variants={itemVariants}
            style={{ y: cardTransforms[index] }}
            className="flex flex-col items-center md:items-start text-center md:text-left group"
          >
            <motion.div
              className="mb-6 p-4 bg-[#111] rounded-2xl border border-white/5 group-hover:border-brand-yellow/30 transition-all duration-500 group-hover:-translate-y-2 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at center, rgba(255,159,0,0.15) 0%, transparent 70%)",
                }}
              />
              <motion.div
                className="transform transition-transform duration-500 group-hover:scale-110 relative z-10"
              >
                {f.icon}
              </motion.div>
            </motion.div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-2 group-hover:text-brand-yellow transition-colors duration-300">{f.title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">{f.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
