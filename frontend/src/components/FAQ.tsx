import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "What internet plans do you offer, and how much do they cost?",
    answer: "We offer high-speed fiber optic internet with fast and reliable connections. Plans start at $39.99 per month.",
    value: "item-1",
  },
  {
    question: "Do you provide mobile services with nationwide coverage?",
    answer:
      "Yes! Our flexible mobile plans come with nationwide coverage, starting at $19.99 per month.",
    value: "item-2",
  },
  {
    question:
      "Is there an option for landline service, and what are the charges?",
    answer:
      "Absolutely! Our landline service provides crystal-clear call quality, with rates starting at $9.99 per month.",
    value: "item-3",
  },
  {
    question: "What TV services do you provide?",
    answer: "We offer a variety of TV plans, including basic TV packages starting at $29.99 per month and premium cable TV packages with HD quality from $49.99 per month.",
    value: "item-4",
  },
  {
    question:
      "Do you offer smart home services, and what do they include?",
    answer:
      "Yes! Our smart home services include home automation and smart devices to enhance your living experience. Plans start at $59.99 per month.",
    value: "item-5",
  },
  {
    question:
      "Can I bundle multiple services for a better deal?",
    answer:
      "Yes! We offer bundle discounts when you combine internet, mobile, TV, or smart home services. Contact us for customized bundle options.",
    value: "item-6",
  },
  {
    question:
      "How can I check if Modern Utilities is available in my area?",
    answer:
      "You can DM us or call 702-850-6149 to check service availability in your location.",
    value: "item-7",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <Accordion
        type="single"
        collapsible
        className="w-full AccordionRoot"
      >
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem
            key={value}
            value={value}
          >
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#contactus"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
