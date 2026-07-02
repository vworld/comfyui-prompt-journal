import { createContext, use } from "react";

export interface NavHistoryContextValue {
  hasPrev(fragment?: string): boolean;
  hasForward(fragment?: string): boolean;

  goBack(): void;
  goForward(): void;
}

export const NavHistoryContext = createContext<NavHistoryContextValue | null>(null);

export function useNavHistory() {
  const context = use(NavHistoryContext);

  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider.");
  }

  return context;
}
