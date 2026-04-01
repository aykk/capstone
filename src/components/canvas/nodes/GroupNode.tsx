"use client";

import { memo, useCallback, useState } from "react";
import { NodeResizer, type NodeProps, useReactFlow } from "reactflow";

export interface GroupNodeData {
  label: string;
}

function GroupNodeComponent({ id, data, selected }: NodeProps<GroupNodeData>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const label = data.label ?? "Group";

  const updateLabel = useCallback(
    (value: string) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: value } } : n
        )
      );
    },
    [id, setNodes]
  );

  return (
    <div
      className={`
        relative h-full w-full rounded-xl border-2 border-dashed bg-zinc-50/60
        transition-colors duration-150
        ${selected ? "border-zinc-400 bg-zinc-100/60" : "border-zinc-300"}
      `}
    >
      <NodeResizer
        minWidth={160}
        minHeight={120}
        isVisible={selected}
        color="#a1a1aa"
        lineStyle={{ borderWidth: 1 }}
        handleStyle={{ width: 7, height: 7, borderRadius: 2 }}
      />

      {/* label sits in the top-left corner of the rectangle */}
      <div className="absolute left-3 top-2">
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => updateLabel(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
            className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-zinc-600 outline-none focus:border-zinc-400 w-36"
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            className="cursor-text select-none rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600"
            title="Double-click to rename"
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
