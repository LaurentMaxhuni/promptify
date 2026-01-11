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
      "Promptify is a browser extension that refines rough prompts into clear, structured instructions in seconds.",
  },
  {
    question: "Where can I use it?",
    answer:
      "It works on ChatGPT, Claude, Gemini, Grok, and Canva through the built-in side panel.",
  },
  {
    question: "How do I enhance a prompt?",
    answer:
      "Open the popup or the side panel, pick a framework, then click Enhance to get an improved prompt.",
  },
  {
    question: "Which frameworks are included?",
    answer:
      "Choose from CREO, RACE, CARE, APE, RISE, TAG, COAST, and CREATE to guide the output style.",
  },
  {
    question: "Does it replace my text automatically?",
    answer:
      "The side panel can replace the active input, while the popup lets you review and copy the result.",
  },
];

const FAQ = () => {
  return (
    <div id="faq" className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-xl">
        <h2 className="text-4xl md:text-5xl leading-[1.15]! font-semibold tracking-[-0.035em]">
          Questions & Answers
        </h2>

        <Accordion type="single" className="mt-6" defaultValue="question-0">
          {faq.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`question-${index}`}>
              <AccordionTrigger className="text-left text-lg">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
