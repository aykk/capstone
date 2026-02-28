"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from "reactflow";

export interface LogicNodeData {
  label: string;
  option?: string;
}

const LOGIC_OPTIONS = [
  { value: "once", label: "Run once" },
  { value: "5x", label: "Run 5 times" },
  { value: "10x", label: "Run 10 times" },
  { value: "untilDone", label: "Run until done" },
] as const;

function LogicNodeComponent({ id, data, selected }: NodeProps<LogicNodeData>) {
  const { setNodes } = useReactFlow();
  const label = data.label ?? "Logic Node";
  const option = data.option ?? "once";

  const updateData = useCallback(
    (updates: Partial<LogicNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const optionLabel = LOGIC_OPTIONS.find((o) => o.value === option)?.label ?? "Run once";

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-zinc-900 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <NodeResizer minWidth={160} minHeight={70} isVisible={selected} color="#a1a1aa" lineStyle={{ borderWidth: 1 }} handleStyle={{ width: 6, height: 6, borderRadius: 2 }} />
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />

      <div className="flex flex-1 flex-col gap-2 px-3 py-2.5">
        <div>
          <div className="truncate text-[13px] font-medium text-zinc-900">{label}</div>
          <div className="text-[11px] text-zinc-400">{optionLabel}</div>
        </div>
        <select
          value={option}
          onChange={(e) => updateData({ option: e.target.value })}
          className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
        >
          {LOGIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* multiple outputs so logic can connect to multiple nodes */}
      <Handle type="source" position={Position.Right} id="out-1" className="!-right-[5px] !top-[25%] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" style={{ transform: "translateY(-50%)" }} />
      <Handle type="source" position={Position.Right} id="out-2" className="!-right-[5px] !top-1/2 !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" style={{ transform: "translateY(-50%)" }} />
      <Handle type="source" position={Position.Right} id="out-3" className="!-right-[5px] !top-[75%] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" style={{ transform: "translateY(-50%)" }} />
    </div>
  );
}

export const LogicNode = memo(LogicNodeComponent);
