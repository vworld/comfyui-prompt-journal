import "@/styles/tokens.css";
import "@/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { Toaster } from "./components/ui/sonner";
import { AlertProvider } from "./context/AlertProvider";
import { SettingsProvider } from "./context/SettingsProvider";

import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "@/routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <SettingsProvider>
        <AlertProvider>
          <RouterProvider router={router} />
        </AlertProvider>
      </SettingsProvider>
      <Toaster position="top-right" richColors={false} />
    </TooltipProvider>
  </StrictMode>,
);
