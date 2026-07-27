import AssignedGenerations from "@/components/explorer/AssignedGenerations";
import ExplorerTree from "@/components/explorer/ExplorerTree";
import UnassignedGenerations from "@/components/explorer/UnassignedGenerations";
import { SplitPane, SplitPanel } from "@/features/split-panel/SplitPanel";

export default function TreeSidebar() {
  return (
    <div className="size-full flex">
      {/* <div className="flex-1"> */}
      <SplitPanel
        id="tree-sidebar"
        className="bg-card rounded-r-lg"
        version="1"
        orientation="vertical"
        debug
      >
        <SplitPane id="tree-sidebar-hierarchy" label="Hierarchy" minimumSize={150} defaultSize={50}>
          <ExplorerTree />
        </SplitPane>
        <SplitPane
          id="tree-sidebar-unassigned"
          label="Unassigned"
          minimumSize={150}
          defaultSize={25}
        >
          <UnassignedGenerations />
        </SplitPane>
        <SplitPane id="tree-sidebar-assigned" label="Assigned" minimumSize={150} defaultSize={25}>
          <AssignedGenerations />
        </SplitPane>
      </SplitPanel>
    </div>
    // </div>
  );
}
