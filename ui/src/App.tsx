import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import { Outlet, useMatches } from "react-router";

import type { RouteHandleData } from "@/types/routes";

import { Header } from "@/components/layout/Header";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { NavHistoryProvider } from "@/context/NavHistoryProvider";
import { NativeImportProvider } from "@/context/drag-drop";

function App() {
  const matches = useMatches();
  const current = matches.at(-1) as RouteHandleData | undefined;

  const hideHeader = current?.handle?.hideHeader ?? false;
  const title = current?.handle.title;

  return (
    <ThemeProvider defaultTheme="dark">
      <NativeImportProvider />
      <NavHistoryProvider>
        <Layout>
          {!hideHeader && <Header title={title} />}
          <Outlet />
        </Layout>
      </NavHistoryProvider>
    </ThemeProvider>
  );
}

export default App;
