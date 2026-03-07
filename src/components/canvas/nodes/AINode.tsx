"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from "reactflow";
import { geminiGenerate } from "@/lib/gemini";

export interface AINodeData {
  label: string;
  prompt: string;
  output: string;
  isGenerating: boolean;
}

// gets the text or label from a node that connects into this one
function getIngestContent(node: { type?: string; data?: Record<string, unknown> }): string {
  const d = node.data ?? {};
  if (node.type === "textNode" && typeof d.content === "string") return d.content;
  if (node.type === "noteNode" && typeof d.content === "string") return d.content;
  if (node.type === "commentNode" && typeof d.content === "string") return d.content;
  if (node.type === "imageNode") return (d.src as string) ?? (d.label as string) ?? "image";
  if (node.type === "logicNode") return (d.label as string) ?? "logic";
  return (d.content as string) ?? (d.label as string) ?? "";
}

function AINodeComponent({ id, data, selected }: NodeProps<AINodeData>) {
  const { setNodes, getIncomers } = useReactFlow();
  const label = data.label ?? "AI Node";
  const prompt = data.prompt ?? "";
  const output = data.output ?? "";
  const isGenerating = data.isGenerating ?? false;

  const updateData = useCallback(
    (updates: Partial<AINodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const handleGenerate = useCallback(async () => {
    const incomers = getIncomers(id);
    const ingestParts = incomers.map((n) => getIngestContent(n)).filter(Boolean);
    const ingestContent = ingestParts.join("\n\n") || undefined;

    updateData({ isGenerating: true });
    try {
      const response = await geminiGenerate(prompt, ingestContent);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, output: response, isGenerating: false } } : node
        )
      );
    } catch {
      updateData({ isGenerating: false });
    }
  }, [id, prompt, getIncomers, setNodes, updateData]);

  const statusText = isGenerating ? "Running..." : output ? "Completed" : "Ready";

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-zinc-900 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <NodeResizer minWidth={200} minHeight={180} isVisible={selected} color="#a1a1aa" lineStyle={{ borderWidth: 1 }} handleStyle={{ width: 6, height: 6, borderRadius: 2 }} />
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />

      <div className="shrink-0 px-3 py-2.5">
        <div className="truncate text-[13px] font-medium text-zinc-900">{label}</div>
        <div className={`text-[11px] ${isGenerating ? "text-zinc-900 font-medium" : "text-zinc-400"}`}>
          {statusText}
        </div>
      </div>

      {isGenerating && (
        <div className="shrink-0 px-3 pb-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full animate-pulse rounded-full bg-zinc-900" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto border-t border-zinc-100 px-3 py-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => updateData({ prompt: e.target.value })}
          placeholder="Type your prompt..."
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          disabled={isGenerating}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full shrink-0 rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Running..." : "Generate"}
        </button>
        {output && (
          <textarea
            readOnly
            value={output}
            className="min-h-[80px] flex-1 resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] leading-tight text-zinc-700"
          />
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-300 !bg-white" />
    </div>
  );
}

export const AINode = memo(AINodeComponent);
