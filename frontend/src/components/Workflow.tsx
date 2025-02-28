
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { cn } from "@/lib/utils"


export const Workflow = () => {

    const sections = [
        {
          title: "The Benefits of Working with Modern Utilities",
          items: [
            "Local Presence: We're a local business, readily available to address your concerns.",
            "Multilingual Support: Our team communicates effectively in English, ensuring clear understanding.",
            "Technical Expertise: We possess in-depth knowledge of the utilities industry, guiding you through complex processes.",
            "Convenience: Reach us 7 days a week via call or text, and speak directly with a knowledgeable representative.",
            "Unbiased Guidance: As a liaison between you and top utility providers (Cox, CenturyLink, Directv, Welink, Tmobile, Ultra mobile), we offer impartial advice, free of charge.",
          ],
          bulletColor: "text-green-500",
        },
        {
          title: "Avoid Corporate Call Center Hassles",
          items: [
            "Language Barriers: Communication challenges can lead to misunderstandings.",
            "Lack of Knowledge: Representatives may not fully comprehend your needs or the services offered.",
            "Long Wait Times: Navigating automated prompts and enduring lengthy hold times can be tedious.",
            "Dishonest Practices: Some representatives may prioritize commissions over transparency.",
          ],
          bulletColor: "text-red-500",
        },
        {
          title: "Experience the Modern Utilities Difference",
          items: [
            "Accurate Assessments: We provide realistic expectations about utility performance.",
            "Clear Explanations: Our team breaks down complex terms and conditions, ensuring you understand your options.",
            "Unbiased Recommendations: We suggest the best solutions for your specific needs, without pushing specific providers.",
          ],
          bulletColor: "text-green-500",
        },
        {
          title: "Our Proven Track Record",
          items: [
            "Thousands of 5-Star Reviews: Our customers rave about our exceptional service.",
            "15 Years of Excellence: As a disabled Army combat veteran-owned business, we've established a reputation for trustworthiness and expertise.",
            "Nationwide Coverage: We now serve all 50 states, offering comprehensive support for various utility providers.",
          ],
          bulletColor: "text-green-500",
        },
      ]


  return (
    <section className="container py-24 sm:py-32 space-y-8">
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Why Choose <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Modern Utilities
        </span>?</h2>
      <p className="text-gray-400">
        In a crowded market, Modern Utilities stands out as a trusted partner for your utility needs. Unlike
        corporate call centers, our team offers personalized expertise, flawless English communication, and a deep
        understanding of the process. This ensures a seamless and comforting experience for our customers.
      </p>
    </div>

    <Accordion type="single" collapsible className="w-full space-y-4">
      {sections.map((section, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border border-zinc-800 rounded-lg px-4">
          <AccordionTrigger className="text-xl font-semibold hover:text-green-500">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 text-gray-400 py-4">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start">
                  <span className={cn("mr-2", section.bulletColor)}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>

    <div className="text-center space-y-4 pt-8">
      <h3 className="text-2xl font-bold">Get Started Today</h3>
      <p className="text-gray-400">
        Contact us anytime at{" "}
        <a href="tel:702-300-8488" className="text-green-500 hover:underline">
          702-300-8488
        </a>{" "}
        to experience the Modern Utilities difference.
      </p>
    </div>
  </section>
  );
};
