import { Outlet } from "react-router";

import TreeSidebar from "@/components/explorer/TreeSidebar";
import { ExplorerTreeProvider } from "@/components/explorer/tree-context/ExplorerTreeProvider";
import { SplitPane, SplitPanel } from "@/features/split-panel";

export default function ExplorerLayout() {
  return (
    <ExplorerTreeProvider>
      <div className="size-full flex">
        <div className="flex-1 mt-2">
          <SplitPanel
            id="explorer-horizontal"
            // className="h-full w-full overflow-hidden"
            version="1"
            orientation="horizontal"
            hideHeader={true}
          >
            <SplitPane id="explorer-sidebar-pane" label="A" minimumSize={20} defaultSize={25}>
              <TreeSidebar />
            </SplitPane>
            <SplitPane id="explorer-content-pane" label="" minimumSize={20} defaultSize={75}>
              <Outlet />
            </SplitPane>
          </SplitPanel>
        </div>
      </div>
    </ExplorerTreeProvider>
  );
}
