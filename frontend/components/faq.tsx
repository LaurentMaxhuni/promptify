"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faq = [
  {
    question: "What does Promptify do?",
    answer:
      "Promptify is a browser extension that refines rough prompts into clear, structured instructions. Choose a framework, click enhance, and get a polished prompt ready to use.",
  },
  {
    question: "Which AI platforms are supported?",
    answer:
      "Promptify works on ChatGPT, Claude, Gemini, Grok, Canva, Perplexity, Poe, Copilot, DeepSeek, Mistral, and Meta AI.",
  },
  {
    question: "How do frameworks work?",
    answer:
      "Frameworks like CREO, RACE, TAG, and CREATE guide how your prompt is restructured. Each follows a specific reasoning process to organize the output.",
  },
  {
    question: "How does it work on supported sites?",
    answer:
      "Promptify adds an inline Optimize button near the active prompt composer. It replaces the composer text after a successful enhancement. The popup lets you review and copy a result without changing the page.",
  },
  {
    question: "Is my data private?",
    answer:
      "When you optimize a prompt, it is sent to the Promptify Worker and forwarded to Groq for processing. The popup can store a capped history locally; the Worker does not intentionally log prompt text. See the privacy policy for details.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="relative py-32 md:py-48 px-6 overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faq.map(({ question, answer }, index) => (
              <AccordionItem key={question} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium py-4">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
