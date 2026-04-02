"use client";

import { memo, useCallback, useState, useEffect } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  useReactFlow,
  useStore,
  getIncomers,
} from "reactflow";
import { geminiGenerate } from "@/lib/gemini";
import { buildContextPrompt } from "@/lib/aiContext";
import { useHighlightedNodes } from "@/context/HighlightedNodesContext";

export interface AINodeData {
  label: string;
  prompt: string;
  output: string;
  isGenerating: boolean;
}

const GENERATE_MODES = [
  { value: "analyze", label: "Analyze" },
  { value: "summarize", label: "Summarize" },
  { value: "actions", label: "Action Items" },
  { value: "ideas", label: "Expand Ideas" },
] as const;

type GenerateMode = (typeof GENERATE_MODES)[number]["value"];

const MODE_SUFFIX: Record<GenerateMode, string> = {
  analyze:
    "Analyze the above context and provide a structured recommendation, highlighting key insights, risks, and suggested next steps.",
  summarize: "Summarize the above context into a concise paragraph.",
  actions:
    "Based on the above context, list 3-5 concrete action items. Format each as a bullet starting with '- '.",
  ideas:
    "Based on the above context, suggest 3-5 new ideas or improvements. Format each as a bullet starting with '- '.",
};

const MODE_NODE_TYPE: Partial<Record<GenerateMode, string>> = {
  actions: "actionItemNode",
  ideas: "ideaNode",
  summarize: "summaryNode",
};

function AINodeComponent({ id, data, selected }: NodeProps<AINodeData>) {
  const { setNodes, getNode, getNodes, getEdges } = useReactFlow();
  const edges = useStore((s) => s.edges);
  const nodes = useStore((s) => s.nodeInternals);
  const { setHighlightedNodeIds } = useHighlightedNodes();

  useEffect(() => {
    const self = getNode(id);
    if (selected && self) {
      const incomers = getIncomers(self, getNodes(), getEdges());
      setHighlightedNodeIds(new Set(incomers.map((n) => n.id)));
    } else {
      setHighlightedNodeIds(new Set());
    }
  }, [selected, id, getNode, getNodes, getEdges, setHighlightedNodeIds]);

  const prompt = data.prompt ?? "";
  const output = data.output ?? "";
  const isGenerating = data.isGenerating ?? false;
  const [mode, setMode] = useState<GenerateMode>("analyze");

  const updateData = useCallback(
    (updates: Partial<AINodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node,
        ),
      );
    },
    [id, setNodes],
  );

  const spawnNodes = useCallback(
    (lines: string[], nodeType: string) => {
      const sourceNode = getNode(id);
      const baseX = (sourceNode?.position.x ?? 0) + 280;
      const baseY = sourceNode?.position.y ?? 0;
      const newNodes = lines
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
        .map((content, i) => ({
          id: `${nodeType}-gen-${Date.now()}-${i}`,
          type: nodeType,
          position: { x: baseX, y: baseY + i * 180 },
          style: { width: 220, height: 160 },
          data: {
            label:
              nodeType === "actionItemNode"
                ? "Action Item"
                : nodeType === "summaryNode"
                  ? "Summary"
                  : "Idea",
            content,
            assignee: "",
          },
        }));
      setNodes((nds) => [...nds, ...newNodes]);
    },
    [id, getNode, setNodes],
  );

  const handleGenerate = useCallback(async () => {
    const taskSuffix = prompt.trim() ? prompt : MODE_SUFFIX[mode];
    const structuredPrompt = buildContextPrompt(
      id,
      taskSuffix,
      edges,
      nodes as unknown as Map<
        string,
        { id: string; type?: string; data?: Record<string, unknown> }
      >,
    );

    updateData({ isGenerating: true });
    try {
      const response = await geminiGenerate(structuredPrompt);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: { ...node.data, output: response, isGenerating: false },
              }
            : node,
        ),
      );

      const spawnType = MODE_NODE_TYPE[mode];
      if (spawnType) {
        const lines = response
          .split("\n")
          .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
        if (lines.length > 0) spawnNodes(lines, spawnType);
        else if (mode === "summarize") spawnNodes([response], "summaryNode");
      }
    } catch {
      updateData({ isGenerating: false });
    }
  }, [id, prompt, mode, edges, nodes, setNodes, updateData, spawnNodes]);

  const statusText = isGenerating
    ? "Thinking..."
    : output
      ? "Response ready"
      : "Ask Gemini";

  return (
    <div
      className={`
        group relative flex h-full min-h-0 w-full flex-col rounded-lg border bg-white
        transition-all duration-150 hover:shadow-md
        ${selected ? "border-violet-600 shadow-md" : "border-zinc-200 shadow-sm"}
      `}
    >
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-violet-600" />
      <NodeResizer
        minWidth={220}
        minHeight={200}
        isVisible={selected}
        color="#7c3aed"
        lineStyle={{ borderWidth: 1 }}
        handleStyle={{ width: 6, height: 6, borderRadius: 2 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-violet-200 !bg-white"
      />

      <div className="shrink-0 pl-4 pr-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider  ">
          Ask Gemini
        </div>
        <div
          className={`text-[11px] mt-0.5 ${isGenerating ? "text-violet-500 font-medium" : "text-zinc-400"}`}
        >
          {statusText}
        </div>
      </div>

      {isGenerating && (
        <div className="shrink-0 pl-4 pr-3 pb-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full animate-pulse rounded-full bg-violet-400"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto border-t border-zinc-100 pl-4 pr-3 py-2 nodrag">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as GenerateMode)}
          disabled={isGenerating}
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 focus:border-violet-300 focus:outline-none"
        >
          {GENERATE_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={prompt}
          onChange={(e) => updateData({ prompt: e.target.value })}
          placeholder="Override prompt (optional)..."
          className="w-full shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-violet-300 focus:outline-none"
          disabled={isGenerating}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full shrink-0 rounded border border-violet-600 bg-violet-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-violet-200 !bg-white"
      />
    </div>
  );
}

export const AINode = memo(AINodeComponent);
