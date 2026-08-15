"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { ComponentProps } from "react";

const navLinks = [
  { label: "Overview", href: "#overview" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

type NavMenuProps = ComponentProps<typeof NavigationMenu> & {
  onNavigate?: () => void;
};

export const NavMenu = ({ onNavigate, ...props }: NavMenuProps) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      {navLinks.map((link) => (
        <NavigationMenuItem key={link.label}>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={link.href} onClick={onNavigate}>
              {link.label}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);
