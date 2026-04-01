"use client";

import { memo, useCallback } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  useReactFlow,
} from "reactflow";

export interface ActionItemNodeData {
  label: string;
  content: string;
  assignee: string;
}

function ActionItemNodeComponent({
  id,
  data,
  selected,
}: NodeProps<ActionItemNodeData>) {
  const { setNodes } = useReactFlow();
  const content = data.content ?? "";
  const assignee = data.assignee ?? "";

  const updateData = useCallback(
    (updates: Partial<ActionItemNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...updates } }
            : node,
        ),
      );
    },
    [id, setNodes],
  );

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-red-500 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-red-500" />
      <NodeResizer
        minWidth={200}
        minHeight={160}
        isVisible={selected}
        color="#ef4444"
        lineStyle={{ borderWidth: 1 }}
        handleStyle={{ width: 6, height: 6, borderRadius: 2 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[5px] !h-3 !w-3 !rounded-full !border-2 !border-red-200 !bg-white"
      />

      <div className="shrink-0 pl-4 pr-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider  ">
          Action Item
        </div>
        <div className="truncate text-[11px] text-zinc-400 mt-0.5">
          {content ? content.slice(0, 45) : "What needs to be done?"}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t border-zinc-100 pl-4 pr-3 py-2 flex flex-col gap-1.5">
        <input
          type="text"
          value={assignee}
          onChange={(e) => updateData({ assignee: e.target.value })}
          placeholder="Assigned to..."
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-red-300 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="Describe the action item..."
          className="flex-1 min-h-[60px] w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-red-300 focus:outline-none"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[5px] !h-3 !w-3 !rounded-full !border-2 !border-red-200 !bg-white"
      />
    </div>
  );
}

export const ActionItemNode = memo(ActionItemNodeComponent);
