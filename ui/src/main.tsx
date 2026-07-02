import "@/styles/tokens.css";
import "@/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { Toaster } from "./components/ui/sonner";
import { AlertProvider } from "./context/AlertProvider";
import { SettingsProvider } from "./context/SettingsProvider";

import App from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import BrowseGenerations from "@/pages/BrowseGenerations";
import IndexPage from "@/pages/IndexPage";
import ReviewConsolePage from "@/pages/ReviewConsolePage";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <IndexPage />, handle: { hideHeader: false, title: "Review Console" } },
      {
        path: "review-console/:generationId",
        element: <ReviewConsolePage />,
        handle: { hideHeader: false, title: "Review Console" },
      },
      {
        path: "browse-generation",
        element: <BrowseGenerations />,
        handle: { title: "Generations" },
      },
    ],
  },
]);

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
