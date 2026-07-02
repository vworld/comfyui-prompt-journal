import { useState } from "react";

import type { PromptsAccordionProps } from "@/types";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PromptsAccordion({ prompts }: Readonly<PromptsAccordionProps>) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    const firstTag = prompts[0]?.tag;
    return firstTag ? [firstTag] : [];
  });

  return (
    <div className="flex-none bg-background">
      <div className="flex items-center justify-between px-3.5 pb-1.5 pt-2 font-mono text-tiny uppercase tracking-wide text-muted-foreground">
        <span>Prompts</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
          {prompts.length}
        </span>
      </div>
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="flex flex-col gap-1.5 pb-2.5 border-0"
      >
        {prompts.map((prompt, index) => {
          const isOpen = openItems.includes(prompt.tag);
          return (
            <AccordionItem
              // eslint-disable-next-line react-x/no-array-index-key
              key={`${prompt.tag}-${index}`}
              value={prompt.tag}
              className="rounded-md border border-border overflow-hidden not-last:border-b-0"
            >
              <AccordionTrigger className="flex w-full items-center gap-2.5 bg-card px-3 py-2 text-left text-xs font-normal no-underline hover:no-underline disabled:pointer-events-none disabled:opacity-50 [&_[data-slot=accordion-trigger-icon]]:hidden">
                <span
                  className={`flex-none font-mono text-xxs uppercase tracking-wide ${prompt.tone === "negative" ? "text-destructive" : "text-foreground"}`}
                >
                  {prompt.tag}
                </span>
                {!isOpen && (
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {prompt.text}
                  </span>
                )}
                <span
                  className={`ml-auto flex-none text-tiny text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                >
                  ▸
                </span>
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-wrap border-t border-border bg-workspace px-3.5 py-3 text-foreground text-sm-plus leading-relaxed h-auto">
                {prompt.text}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
