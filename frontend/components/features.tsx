"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  SlidersHorizontal,
  PanelRightOpen,
  Replace,
  ClipboardCopy,
  Globe,
} from "lucide-react";
import { useRef } from "react";

const features = [
  {
    icon: Sparkles,
    title: "One-Click Boost",
    description: "Turn rough prompts into clear, usable instructions in seconds.",
    span: "col-span-1 row-span-1",
  },
  {
    icon: SlidersHorizontal,
    title: "Framework-Driven",
    description: "Choose CREO, RACE, CARE, TAG, and more to guide the output.",
    span: "col-span-1 row-span-1",
  },
  {
    icon: PanelRightOpen,
    title: "Inline Panel",
    description: "Enhance prompts on ChatGPT, Claude, Gemini, and Grok without leaving the page.",
    span: "col-span-2 row-span-1",
  },
  {
    icon: Replace,
    title: "Enhance & Replace",
    description: "Rewrite the active input with the improved prompt right where you type.",
    span: "col-span-1 row-span-1",
  },
  {
    icon: ClipboardCopy,
    title: "Copy-Ready Output",
    description: "Review and copy a clean, formatted prompt from the popup.",
    span: "col-span-1 row-span-1",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export default function Features() {
  const ref = useRef(null);

  return (
    <section
      id="features"
      className="relative py-32 md:py-48 px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Prompt enhancement that fits seamlessly into your workflow.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[1fr]"
          style={{ gridAutoFlow: "dense" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 md:p-8 transition-all duration-500 hover:border-primary/20 hover:bg-primary/[0.02] ${feature.span}`}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
