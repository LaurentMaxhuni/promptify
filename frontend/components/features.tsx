import {
  ClipboardCopy,
  Globe,
  PanelRightOpen,
  Replace,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "One-Click Prompt Boost",
    description:
      "Turn rough prompts into clear, usable instructions in seconds.",
  },
  {
    icon: SlidersHorizontal,
    title: "Framework-Driven Refinement",
    description:
      "Choose CREO, RACE, CARE, TAG, and more to guide the output style.",
  },
  {
    icon: PanelRightOpen,
    title: "Inline Side Panel",
    description:
      "Open the tab on supported sites and enhance without leaving the page.",
  },
  {
    icon: Replace,
    title: "Enhance and Replace",
    description:
      "Rewrite the active input and drop the improved prompt right where you type.",
  },
  {
    icon: ClipboardCopy,
    title: "Copy-Ready Output",
    description:
      "Use the popup to review and copy a formatted prompt fast.",
  },
  {
    icon: Globe,
    title: "Multi-Site Support",
    description:
      "Works on ChatGPT, Claude, Gemini, Grok, and Canva out of the box.",
  },
];

const Features = () => {
  return (
    <div id="features" className="min-h-screen flex items-center justify-center py-12">
      <div>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-center">
          Unleash Your Creativity
        </h2>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-(--breakpoint-lg) mx-auto px-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col border rounded-xl py-6 px-5"
            >
              <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                <feature.icon className="size-5" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
