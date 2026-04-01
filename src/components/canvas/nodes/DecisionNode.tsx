"use client";

import { memo, useCallback } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  useReactFlow,
} from "reactflow";

export interface DecisionNodeData {
  label: string;
  content: string;
  outcome: string;
}

const OUTCOMES = ["Pending", "Approved", "Rejected", "Deferred"] as const;

const OUTCOME_STYLES: Record<
  string,
  { bar: string; border: string; resizer: string; handle: string }
> = {
  Pending: {
    bar: "bg-zinc-400",
    border: "border-zinc-400",
    resizer: "#a1a1aa",
    handle: "!border-zinc-200",
  },
  Approved: {
    bar: "bg-blue-500",
    border: "border-blue-500",
    resizer: "#3b82f6",
    handle: "!border-blue-200",
  },
  Rejected: {
    bar: "bg-red-500",
    border: "border-red-500",
    resizer: "#ef4444",
    handle: "!border-red-200",
  },
  Deferred: {
    bar: "bg-amber-500",
    border: "border-amber-500",
    resizer: "#f59e0b",
    handle: "!border-amber-200",
  },
};

function DecisionNodeComponent({
  id,
  data,
  selected,
}: NodeProps<DecisionNodeData>) {
  const { setNodes } = useReactFlow();
  const content = data.content ?? "";
  const outcome = data.outcome ?? "Pending";
  const styles = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.Pending;

  const updateData = useCallback(
    (updates: Partial<DecisionNodeData>) => {
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
        ${selected ? `${styles.border} shadow-md` : "border-zinc-200 shadow-sm"}
      `}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-lg transition-colors duration-200 ${styles.bar}`}
      />
      <NodeResizer
        minWidth={200}
        minHeight={180}
        isVisible={selected}
        color={styles.resizer}
        lineStyle={{ borderWidth: 1 }}
        handleStyle={{ width: 6, height: 6, borderRadius: 2 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={`!-left-[5px] !h-3 !w-3 !rounded-full !border-2 !bg-white ${styles.handle}`}
      />

      <div className="shrink-0 pl-4 pr-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider  ">
          Decision
        </div>
        <div className="text-[11px] mt-0.5 font-medium text-zinc-400">
          {outcome}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t border-zinc-100 pl-4 pr-3 py-2 flex flex-col gap-1.5 nodrag">
        <textarea
          value={content}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="What decision needs to be made?"
          className="flex-1 min-h-[60px] w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
        <select
          value={outcome}
          onChange={(e) => updateData({ outcome: e.target.value })}
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
        >
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!-right-[5px] !h-3 !w-3 !rounded-full !border-2 !bg-white ${styles.handle}`}
      />
    </div>
  );
}

export const DecisionNode = memo(DecisionNodeComponent);
