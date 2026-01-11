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

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      {navLinks.map((link) => (
        <NavigationMenuItem key={link.label}>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={link.href}>{link.label}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);
