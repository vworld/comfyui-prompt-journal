import { createBrowserRouter } from "react-router";

import App from "@/App";
import ExplorerLayout from "@/components/explorer/ExplorerLayout";
import ClipDetailPage from "@/pages/ClipDetailPage";
import GenerationReviewPage from "@/pages/GenerationReviewPage";
import IndexPage from "@/pages/IndexPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectExplorerPage from "@/pages/ProjectExplorerPage";
import ReviewConsolePage from "@/pages/ReviewConsolePage";
import SceneDetailPage from "@/pages/SceneDetailPage";
import ShotDetailPage from "@/pages/ShotDetailPage";

export const router = createBrowserRouter([
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
        path: "explorer",
        element: <ExplorerLayout />,
        handle: { title: "Project Explorer" },
        children: [
          { index: true, element: <ProjectExplorerPage />, handle: { title: "Project Explorer" } },
          {
            path: "projects/:projectId",
            element: <ProjectDetailPage />,
            handle: { title: "Explorer" },
          },
          {
            path: "scenes/:sceneId",
            element: <SceneDetailPage />,
            handle: { title: "Explorer" },
          },
          {
            path: "clips/:clipId",
            element: <ClipDetailPage />,
            handle: { title: "Explorer" },
          },
          {
            path: "shots/:shotId",
            element: <ShotDetailPage />,
            handle: { title: "Explorer" },
          },
          {
            path: "generations/:generationId",
            element: <GenerationReviewPage pane="tree" />,
            handle: { title: "Explorer" },
          },
          {
            path: "assigned/:generationId",
            element: <GenerationReviewPage pane="assigned" />,
            handle: { title: "Assigned" },
          },
          {
            path: "unassigned/:generationId",
            element: <GenerationReviewPage pane="unassigned" />,
            handle: { title: "Unassigned" },
          },
        ],
      },
    ],
  },
]);
