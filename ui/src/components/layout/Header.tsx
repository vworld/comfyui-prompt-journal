import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
export function Header({ title }: Readonly<{ title?: string }>) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2",
        "w-full h-10 bg-workspace",
        "transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
      )}
    >
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <div
          className={cn(
            "flex-none",
            "whitespace-nowrap pr-3.5",
            "text-[13px] font-semibold uppercase tracking-wide text-accent-foreground",
          )}
        >
          {title}
        </div>
      </div>
    </header>
  );
}
