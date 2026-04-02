"use client";

import { memo, useCallback } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  useReactFlow,
} from "reactflow";
import { useHighlightedNodes } from "@/context/HighlightedNodesContext";

export interface QuestionNodeData {
  label: string;
  content: string;
  answered: boolean;
}

function QuestionNodeComponent({
  id,
  data,
  selected,
}: NodeProps<QuestionNodeData>) {
  const { setNodes } = useReactFlow();
  const { highlightedNodeIds } = useHighlightedNodes();
  const isContext = highlightedNodeIds.has(id);
  const content = data.content ?? "";
  const answered = data.answered ?? false;

  const updateData = useCallback(
    (updates: Partial<QuestionNodeData>) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...updates } } : n,
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
        ${selected ? "border-amber-500 shadow-md" : "border-zinc-200 shadow-sm"}
        ${isContext ? "ring-1 ring-green-400" : ""}
      `}
    >
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-amber-500" />
      <NodeResizer
        minWidth={200}
        minHeight={140}
        isVisible={selected}
        color="#f59e0b"
        lineStyle={{ borderWidth: 1 }}
        handleStyle={{ width: 6, height: 6, borderRadius: 2 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[5px] !h-3 !w-3 !rounded-full !border-2 !border-amber-200 !bg-white"
      />

      <div className="shrink-0 pl-4 pr-3 py-2.5 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider  ">
            Question
          </div>
          <div className="text-[11px] mt-0.5 font-medium text-zinc-400">
            {answered ? "Answered" : "Open"}
          </div>
        </div>
        <button
          onClick={() => updateData({ answered: !answered })}
          className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium   bg-zinc-100 transition-colors hover:bg-zinc-200"
        >
          {answered ? "✓" : "Mark answered"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t border-zinc-100 pl-4 pr-3 py-2">
        <textarea
          value={content}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="What needs to be answered?"
          className="h-full min-h-[80px] w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-amber-300 focus:outline-none"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[5px] !h-3 !w-3 !rounded-full !border-2 !border-amber-200 !bg-white"
      />
    </div>
  );
}

export const QuestionNode = memo(QuestionNodeComponent);
