"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="overview"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Full-bleed background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,oklch(0.6_0.2_265_/_0.08),transparent)]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-8">
            <Sparkles className="size-3.5" />
            <span>Intelligent prompt enhancement</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-[clamp(2.8rem,6vw,5rem)] font-semibold tracking-[-0.03em] leading-[1.08] max-w-4xl mx-auto"
        >
          Transform rough prompts into{" "}
          <span className="text-primary">crystal-clear</span> instructions
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Choose from frameworks like RACE, CREO, TAG, and CREATE to shape how your prompt is enhanced. One click, done.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-10 flex items-center justify-center gap-4 flex-col sm:flex-row"
        >
          <Button size="lg" className="rounded-full text-base h-12 px-8" asChild>
            <Link href="https://chromewebstore.google.com/detail/promptify/egbcpmegonokjknlibpddibiocjfoggg">
              Get Extension <ArrowUpRight className="size-4 ml-1" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full text-base h-12 px-8"
            asChild
          >
            <Link href="https://github.com/LaurentMaxhuni/promptify">
              View on GitHub
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
