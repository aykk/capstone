"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { useHighlightedNodes } from "@/context/HighlightedNodesContext";

export interface ConnectorNodeData {
  label?: string;
}

// small junction dot — links multiple ideas together on the canvas
function ConnectorNodeComponent({ id, selected }: NodeProps<ConnectorNodeData>) {
  const { highlightedNodeIds } = useHighlightedNodes();
  const isContext = highlightedNodeIds.has(id);
  return (
    <div className="relative flex flex-col items-center gap-1">
      <div
        className={`
          relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white
          transition-all duration-150 hover:shadow-md
          ${selected ? "border-zinc-900 shadow-md" : "border-zinc-400 shadow-sm"}
          ${isContext ? "ring-1 ring-green-400" : ""}
        `}
      >
        <div className="h-2 w-2 rounded-full bg-zinc-400" />
        <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
        <Handle type="source" position={Position.Right} id="out-1" className="!-right-[5px] !top-1/2 !-translate-y-1/2 !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
        <Handle type="source" position={Position.Bottom} id="out-2" className="!-bottom-[5px] !left-1/2 !-translate-x-1/2 !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
      </div>
      <span className="text-[9px] text-zinc-400 select-none">connect</span>
    </div>
  );
}

export const ConnectorNode = memo(ConnectorNodeComponent);
