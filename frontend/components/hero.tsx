import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <div
      id="overview"
      className="relative min-h-screen py-6 flex items-center justify-center px-6"
    >
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 h-full skew-y-12"
        )}
      />
      <div className="relative z-10 text-center max-w-3xl">
        <Badge
          variant="secondary"
          className="rounded-full py-1 border-border"
          asChild
        >
          <Link href="https://github.com/LaurentMaxhuni/promptify/releases/tag/v1.2">
            Just released v1.2 <ArrowUpRight className="ml-1 size-4" />
          </Link>
        </Badge>
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.2] font-semibold tracking-tighter">
          Promptify: AI Prompt Enhancer
        </h1>
        <p className="mt-6 md:text-lg text-foreground/80">
          Enhance your prompt by choosing from a variety of frameworks such as RACE, CREATE, TAG, CREO which tell the enhancer how the output should be based on your current prompt. Just one click and done.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button size="lg" disabled className="rounded-full text-base">
            Get Extension <ArrowUpRight className="h-5! w-5!" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full text-base shadow-none cursor-pointer"
            render={<Link href='https://github.com/LaurentMaxhuni/promptify/releases/tag/v1.2' />}
          >
            <CirclePlay className="h-5! w-5!" /> Get via GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
