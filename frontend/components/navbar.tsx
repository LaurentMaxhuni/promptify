"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NavMenu } from "@/components/nav-menu";
import { NavigationSheet } from "@/components/navigation-sheet";
import Link from "next/link";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="fixed z-50 top-4 inset-x-4 max-w-2xl mx-auto h-12 bg-background/70 backdrop-blur-xl border border-border/50 rounded-full shadow-lg shadow-black/5"
    >
      <div className="h-full flex items-center justify-between px-4">
        <Logo />

        <div className="hidden md:flex items-center">
          <NavMenu />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-full text-xs h-8 px-4" asChild>
            <Link href="https://chromewebstore.google.com/detail/promptify/egbcpmegonokjknlibpddibiocjfoggg">
              Install
            </Link>
          </Button>
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
