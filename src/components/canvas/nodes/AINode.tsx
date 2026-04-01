"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow, useStore } from "reactflow";
import { geminiGenerate } from "@/lib/gemini";

export interface AINodeData {
  label: string;
  prompt: string;
  output: string;
  isGenerating: boolean;
}

function getIngestContent(node: { type?: string; data?: Record<string, unknown> }): string {
  const d = node.data ?? {};
  if (typeof d.content === "string") return d.content;
  return (d.label as string) ?? "";
}

function AINodeComponent({ id, data, selected }: NodeProps<AINodeData>) {
  const { setNodes } = useReactFlow();
  const edges = useStore((s) => s.edges);
  const nodes = useStore((s) => s.nodeInternals);
  const prompt = data.prompt ?? "";
  const output = data.output ?? "";
  const isGenerating = data.isGenerating ?? false;

  const updateData = useCallback(
    (updates: Partial<AINodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const handleGenerate = useCallback(async () => {
    // find all nodes that have an edge pointing into this node
    const incomerIds = edges
      .filter((e) => e.target === id)
      .map((e) => e.source);
    const ingestParts = incomerIds
      .map((srcId) => {
        const n = nodes.get(srcId);
        return n ? getIngestContent(n) : "";
      })
      .filter(Boolean);
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
  }, [id, prompt, edges, nodes, setNodes, updateData]);

  const statusText = isGenerating ? "Thinking..." : output ? "Response ready" : "Ask Gemini";

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-purple-500 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-purple-500" />
      <NodeResizer minWidth={220} minHeight={200} isVisible={selected} color="#a855f7" lineStyle={{ borderWidth: 1 }} handleStyle={{ width: 6, height: 6, borderRadius: 2 }} />
      <Handle type="target" position={Position.Left} className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-purple-300 !bg-white" />

      <div className="shrink-0 pl-4 pr-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-500">✨ Ask Gemini</div>
        <div className={`text-[11px] mt-0.5 ${isGenerating ? "text-purple-500 font-medium" : "text-zinc-400"}`}>
          {statusText}
        </div>
      </div>

      {isGenerating && (
        <div className="shrink-0 pl-4 pr-3 pb-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full animate-pulse rounded-full bg-purple-400" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto border-t border-zinc-100 pl-4 pr-3 py-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => updateData({ prompt: e.target.value })}
          placeholder="Ask a question or request ideas..."
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-purple-400 focus:outline-none"
          disabled={isGenerating}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full shrink-0 rounded border border-purple-600 bg-purple-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Thinking..." : "Ask Gemini"}
        </button>
        {output && (
          <textarea
            readOnly
            value={output}
            className="min-h-[80px] flex-1 resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] leading-tight text-zinc-700"
          />
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-purple-300 !bg-white" />
    </div>
  );
}

export const AINode = memo(AINodeComponent);
