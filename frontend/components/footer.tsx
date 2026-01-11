import { Separator } from "@/components/ui/separator";
import { BookOpen, GithubIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";

const footerLinks = [
  {
    title: "Overview",
    href: "#overview",
  },
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "FAQ",
    href: "#faq",
  },
  {
    title: "GitHub",
    href: "https://github.com/LaurentMaxhuni/promptify",
    external: true,
  },
  {
    title: "Support",
    href: "https://github.com/LaurentMaxhuni/promptify/issues",
    external: true,
  },
];

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/LaurentMaxhuni/promptify",
    icon: GithubIcon,
  },
  {
    label: "Docs",
    href: "https://github.com/LaurentMaxhuni/promptify#readme",
    icon: BookOpen,
  },
  {
    label: "Support",
    href: "https://github.com/LaurentMaxhuni/promptify/issues",
    icon: MessageCircle,
  },
];

const Footer = () => {
  return (
    <div className="flex flex-col">
      <footer className="border-t">
        <div className="max-w-(--breakpoint-xl) mx-auto">
          <div className="py-12 flex flex-col justify-start items-center">
            {/* Logo */}
            <Logo />
            <ul className="mt-6 flex items-center gap-4 flex-wrap">
              {footerLinks.map(({ title, href, external }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground"
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            {/* Copyright */}
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()} {" "}
              <Link
                href="https://github.com/LaurentMaxhuni/promptify"
                target="_blank"
                rel="noreferrer"
              >
                Promptify
              </Link>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted-foreground">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
