import { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";

import { NavHistoryContext, type NavHistoryContextValue } from "@/context/NavHistoryContext";

export function NavHistoryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const navigate = useNavigate();

  const current = useRef<string | null>(null);
  const history = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const scope = useRef<"back" | "forward" | null>(null);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;

    // refresh
    if (current.current === path) {
      return;
    }

    const action = scope.current;
    console.log("action_", action);
    switch (action) {
      case "back": {
        if (current.current) future.current.push(current.current);
        current.current = path;
        break;
      }
      case "forward": {
        if (current.current) history.current.push(current.current);
        current.current = path;
        break;
      }
      case null: {
        if (current.current) history.current.push(current.current);
        current.current = path;
        future.current = [];
        break;
      }
    }

    scope.current = null;
  }, [location.hash, location.pathname, location.search]);

  const goBack = useCallback(() => {
    const prev = history.current.pop();

    if (!prev) return;

    scope.current = "back";

    void navigate(prev);
  }, [navigate]);

  const goForward = useCallback(() => {
    const next = future.current.pop();

    if (!next) return;

    scope.current = "forward";

    void navigate(next);
  }, [navigate]);

  const hasPrev = useCallback((fragment?: string) => {
    const prev = history.current.at(-1);

    if (!prev) return false;

    return fragment ? prev.includes(fragment) : true;
  }, []);

  const hasForward = useCallback((fragment?: string) => {
    const next = future.current.at(-1);

    if (!next) return false;

    return fragment ? next.includes(fragment) : true;
  }, []);

  useEffect(() => {
    const handleMouseNavigation = (e: MouseEvent) => {
      // e.button 3 is Mouse 4 (Back), e.button 4 is Mouse 5 (Forward)
      if (!(e.button === 3 || e.button === 4)) {
        return;
      }

      // 1. Block the native webview navigation entirely on all event phases
      e.preventDefault();
      e.stopPropagation();

      // 2. Only execute your navigation logic on button release (mouseup)
      // This mimics natural OS behavior and prevents the double-fire
      if (e.type === "mouseup") {
        if (e.button === 3) {
          goBack();
        } else if (e.button === 4) {
          goForward();
        }
      }
    };

    // 'mousedown' is used because webviews usually trigger
    // history navigation on the press, not the release.
    addEventListener("mousedown", handleMouseNavigation);
    addEventListener("mouseup", handleMouseNavigation);
    addEventListener("auxclick", handleMouseNavigation);

    return () => {
      removeEventListener("mousedown", handleMouseNavigation);
      removeEventListener("mouseup", handleMouseNavigation);
      removeEventListener("auxclick", handleMouseNavigation);
    };
  }, [goBack, goForward]);

  const value = useMemo<NavHistoryContextValue>(
    () => ({
      hasPrev,
      hasForward,
      goBack,
      goForward,
    }),
    [goBack, goForward, hasForward, hasPrev],
  );

  return <NavHistoryContext value={value}>{children}</NavHistoryContext>;
}
