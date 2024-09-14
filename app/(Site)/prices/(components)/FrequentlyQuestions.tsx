import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

type FAQ = {
  question: string;
  answer: string;
};

type FrequentlyQuestionsProps = {
  faqs: FAQ[];
};

export default function FrequentlyQuestions({
  faqs,
}: FrequentlyQuestionsProps) {
  return (
    <div className="w-full max-w-[80rem] mx-auto px-4 rounded-lg mb-12 md:mb-24">
      <Accordion type="single" collapsible className="mb-4">
        {faqs.map((faq, index) => (
          <div key={index} className="flex w-full flex-col gap-4">
            <AccordionItem
              className="mb-4 bg-purple-100 rounded-2xl px-4"
              value={`item-${index}`}
            >
              <AccordionTrigger className="text-lg font-semibold text-blueKommo">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-blueKommo">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </div>
  );
}
