import type { TreeNode } from "@/components/explorer/types";

export function labelFor(node: TreeNode): string {
  switch (node.kind) {
    case "project": {
      return node.data.name;
    }
    case "scene": {
      return `${node.data.number ?? "?"} - ${node.data.name}`;
    }
    case "clip": {
      return `${node.data.number ?? "?"} - ${node.data.name}`;
    }
    case "shot": {
      return `${node.data.number ?? "?"} - ${node.data.name}`;
    }
    case "generation": {
      const parts = [`Attempt ${node.data.attempt_num}`];
      //if (node.data.workflow_name) parts.push(node.data.workflow_name);
      //if (node.data.seed != null) parts.push(`seed ${node.data.seed}`);
      return parts.join(" · ");
    }
  }
}
