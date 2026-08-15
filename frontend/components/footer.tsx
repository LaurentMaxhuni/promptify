"use client";

import { motion } from "framer-motion";
import { BookOpen, GithubIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";

const footerLinks = [
  { title: "Overview", href: "#overview" },
  { title: "Features", href: "#features" },
  { title: "FAQ", href: "#faq" },
  { title: "Privacy", href: "/privacy" },
  { title: "GitHub", href: "https://github.com/LaurentMaxhuni/promptify", external: true },
  { title: "Support", href: "https://github.com/LaurentMaxhuni/promptify/issues", external: true },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/LaurentMaxhuni/promptify", icon: GithubIcon },
  { label: "Docs", href: "https://github.com/LaurentMaxhuni/promptify#readme", icon: BookOpen },
  { label: "Support", href: "https://github.com/LaurentMaxhuni/promptify/issues", icon: MessageCircle },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <Logo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6"
          >
            {footerLinks.map(({ title, href, external }) => (
              <Link
                key={title}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
              >
                {title}
              </Link>
            ))}
          </motion.div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Promptify. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
