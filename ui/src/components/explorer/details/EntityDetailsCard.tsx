import { MoreVertical, RefreshCcw } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export interface ActionButton {
  label: string;
  variant: "destructive" | "secondary";
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  hoverText?: string;
}

interface EntityDetailsCardProps {
  readonly title: string;
  readonly description: string;
  readonly onRefresh: () => void | Promise<void>;
  readonly actionButtons?: ActionButton[];
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly entityType: string;
}

export function EntityDetailsCard({
  title,
  description,
  onRefresh,
  actionButtons = [],
  children,
  className,
  entityType,
}: EntityDetailsCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const destructiveButtons = actionButtons.filter((b) => b.variant === "destructive");
  const secondaryButtons = actionButtons.filter((b) => b.variant === "secondary");

  return (
    <Card className={cn("shrink-0", className)}>
      <CardHeader className="text-accent-foreground/90">
        <CardTitle className="flex text-lg justify-between">
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs font-mono lowercase">
            {entityType}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {description}
            <Button variant="outline" size="sm" onClick={() => void onRefresh()}>
              <RefreshCcw />
              Refresh
            </Button>
          </div>
          {/* Desktop: Full button row */}
          <div className="hidden md:space-x-2 md:flex">
            {actionButtons.map((button, index) => {
              if (button.hoverText) {
                return (
                  // eslint-disable-next-line react-x/no-array-index-key
                  <HoverCard key={index}>
                    <HoverCardTrigger delay={50} closeDelay={500}>
                      <Button
                        variant={button.variant}
                        size="sm"
                        onClick={() => void button.onClick()}
                        disabled={button.disabled}
                      >
                        {button.icon}
                        {button.label}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="top">{button.hoverText}</HoverCardContent>
                  </HoverCard>
                );
              }
              return (
                <Button
                  // eslint-disable-next-line react-x/no-array-index-key
                  key={index}
                  variant={button.variant}
                  size="sm"
                  onClick={() => void button.onClick()}
                  disabled={button.disabled}
                >
                  {button.icon}
                  {button.label}
                </Button>
              );
            })}
          </div>
          {/* Mobile: Ellipsis dropdown */}
          <div className="md:hidden">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm">
                    <MoreVertical />
                  </Button>
                }
              ></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryButtons.map((button, index) => (
                  // eslint-disable-next-line react-x/no-array-index-key
                  <DropdownMenuItem key={index} onClick={() => void button.onClick()}>
                    {button.icon}
                    {button.label}
                  </DropdownMenuItem>
                ))}
                {destructiveButtons.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {destructiveButtons.map((d, index) => (
                      <DropdownMenuItem
                        // eslint-disable-next-line react-x/no-array-index-key
                        key={index}
                        variant="destructive"
                        onClick={() => void d.onClick()}
                        disabled={d.disabled}
                      >
                        {d.icon}
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}
