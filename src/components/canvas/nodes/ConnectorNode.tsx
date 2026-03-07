"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export interface ConnectorNodeData {
  label?: string;
}

// small junction node to route connections between two or more nodes
function ConnectorNodeComponent({ selected }: NodeProps<ConnectorNodeData>) {
  return (
    <div
      className={`
        relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-zinc-900 shadow-md" : "border-zinc-300 shadow-sm"}
      `}
    >
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
      <Handle type="source" position={Position.Right} id="out-1" className="!-right-[5px] !top-1/2 !-translate-y-1/2 !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
      <Handle type="source" position={Position.Bottom} id="out-2" className="!-bottom-[5px] !left-1/2 !-translate-x-1/2 !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
    </div>
  );
}

export const ConnectorNode = memo(ConnectorNodeComponent);
