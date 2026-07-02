/* eslint-disable react-x/no-array-index-key */
import type { PromptsAccordionProps } from "@/types";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function PromptsTabView({ prompts }: Readonly<PromptsAccordionProps>) {
  return (
    <div className="border border-border rounded-md bg-card px-2">
      <div
        className={cn(
          "flex items-center justify-between",
          "px-3.5 pb-1.5 pt-2",
          "border-b border-border",
          "font-mono text-tiny uppercase tracking-wide text-muted-foreground",
        )}
      >
        <span>Prompts</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
          {prompts.length}
        </span>
      </div>
      <Tabs className="pt-4 bg-workspace">
        <TabsList className="mx-3.5">
          {prompts.map((p, index) => (
            <TabsTrigger key={`${p.tag}-${index}`} value={`${p.tag}-${index}`}>
              {p.tag}
            </TabsTrigger>
          ))}
        </TabsList>

        {prompts.map((p, index) => (
          <TabsContent key={`${p.tag}-${index}`} value={`${p.tag}-${index}`} className="">
            <ScrollArea key={`${p.tag}-${index}`} className="h-75 overflow-y-auto -mx-2 mt-2">
              <div className="mx-5.5">
                <span className="whitespace-pre-wrap bg-workspace font-mono text-xs-plus">
                  {p.text}
                </span>
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
