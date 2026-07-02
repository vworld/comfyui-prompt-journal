import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";

import type { CurrentStatsResponse } from "@/types";

import { getStats } from "@/api/stats";
import { cn } from "@/lib/utils";

export default function StatsTable({
  open,
  className,
}: Readonly<{ open: boolean; className?: string }>) {
  const [stats, setStats] = useState<CurrentStatsResponse | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const updatedAt = useRef<Date | null>(null);

  async function fetchStats() {
    setLoading(true);

    const res = await getStats();
    const now = new Date();
    setStats(res);
    setTimeElapsed(formatDistanceToNow(now));
    setLoading(false);
    updatedAt.current = now;
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      const lastUpdated = updatedAt.current;
      if (lastUpdated) {
        const str = formatDistanceToNow(lastUpdated);
        setTimeElapsed(str);
      }
    }, 10_000);
    //

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [open]);

  return (
    <div>
      <div
        className={cn(
          "flex flex-col p-3 text-xs-plus border border-border rounded-md text-muted-foreground font-mono",
          className,
        )}
      >
        <div className="flex justify-between">
          <span className="text-muted-foreground">Generations</span>
          <span className="">{stats?.generation.total}</span>
        </div>

        <div className="ml-3 flex justify-between">
          <span className="text-muted-foreground">↳ Unassigned</span>
          <span>{stats?.generation.unassigned}</span>
        </div>

        <div className="ml-3 flex justify-between">
          <span className="text-muted-foreground">↳ Reviewed</span>
          <span>{stats?.generation.reviewed}</span>
        </div>
        <div className="ml-3 flex justify-between">
          <span className="text-muted-foreground">↳ Unreviewed</span>
          <span>{stats?.generation.unreviewed}</span>
        </div>

        <div className="h-px my-1 bg-border" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Projects</span>
          <span>{stats?.projects}</span>
        </div>

        <div className="h-px my-1 bg-border" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Scenes</span>
          <span>{stats?.scenes}</span>
        </div>

        <div className="h-px my-1 bg-border" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Clips</span>
          <span>{stats?.clips}</span>
        </div>

        <div className="h-px my-1 bg-border" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shots</span>
          <span>{stats?.shots}</span>
        </div>

        <div className="h-px my-1 bg-border" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Files</span>
          <span>{stats?.assets}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-muted-foreground text-xs mt-2">
        <span className="italic">Updated {timeElapsed}</span>
        {loading && <div className="">Updating...</div>}
        {!loading && (
          <span
            className="text-muted-foreground cursor-pointer hover:underline hover:underline-offset-4 hover:text-primary"
            onClick={() => void fetchStats()}
          >
            Update
          </span>
        )}
      </div>
    </div>
  );
}
