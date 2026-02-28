"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from "reactflow";

export interface CommentNodeData {
  label: string;
  content: string;
}

function CommentNodeComponent({ id, data, selected }: NodeProps<CommentNodeData>) {
  const { setNodes } = useReactFlow();
  const label = data.label ?? "Comment";
  const content = data.content ?? "";

  const updateData = useCallback(
    (updates: Partial<CommentNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-zinc-900 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <NodeResizer minWidth={180} minHeight={120} isVisible={selected} color="#a1a1aa" lineStyle={{ borderWidth: 1 }} handleStyle={{ width: 6, height: 6, borderRadius: 2 }} />
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />

      <div className="shrink-0 px-3 py-2.5">
        <div className="truncate text-[13px] font-medium text-zinc-900">{label}</div>
        <div className="truncate text-[11px] text-zinc-400">{content ? content.slice(0, 30) : "No comments"}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t border-zinc-100 px-3 py-2">
        <textarea
          value={content}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="Add a comment..."
          className="h-full min-h-[80px] w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <Handle type="source" position={Position.Right} className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
    </div>
  );
}

export const CommentNode = memo(CommentNodeComponent);
