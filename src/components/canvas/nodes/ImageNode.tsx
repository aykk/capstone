"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from "reactflow";

export interface ImageNodeData {
  label: string;
  src?: string;
  alt?: string;
}

function ImageNodeComponent({ id, data, selected }: NodeProps<ImageNodeData>) {
  const { setNodes } = useReactFlow();
  const label = data.label ?? "Image Node";
  const src = data.src ?? "";

  const updateData = useCallback(
    (updates: Partial<ImageNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const statusText = src ? "Image set" : "Add image URL";

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-zinc-900 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <NodeResizer minWidth={180} minHeight={160} isVisible={selected} color="#a1a1aa" lineStyle={{ borderWidth: 1 }} handleStyle={{ width: 6, height: 6, borderRadius: 2 }} />
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2.5">
        <div className="shrink-0">
          <div className="truncate text-[13px] font-medium text-zinc-900">{label}</div>
          <div className="text-[11px] text-zinc-400">{statusText}</div>
        </div>
        {src ? (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
            <img src={src} alt={data.alt ?? "image"} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        ) : (
          <div className="flex min-h-[80px] flex-1 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50">
            <span className="text-[11px] text-zinc-400">Paste URL below</span>
          </div>
        )}
        <div className="shrink-0">
          <input
            type="url"
            value={src}
            onChange={(e) => updateData({ src: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
    </div>
  );
}

export const ImageNode = memo(ImageNodeComponent);
