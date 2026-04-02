"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  addEdge,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from "reactflow";
import { geminiGenerate } from "@/lib/gemini";
import { buildAnalysisPrompt } from "@/lib/aiContext";
import "reactflow/dist/style.css";
import { IdeaNode } from "./nodes/IdeaNode";
import { CommentNode } from "./nodes/CommentNode";
import { ActionItemNode } from "./nodes/ActionItemNode";
import { AINode } from "./nodes/AINode";
import { ConnectorNode } from "./nodes/ConnectorNode";
import { GroupNode } from "./nodes/GroupNode";
import { CostNode } from "./nodes/CostNode";
import { RiskNode } from "./nodes/RiskNode";
import { GoalNode } from "./nodes/GoalNode";
import { DecisionNode } from "./nodes/DecisionNode";
import { StakeholderNode } from "./nodes/StakeholderNode";
import { QuestionNode } from "./nodes/QuestionNode";
import { SummaryNode } from "./nodes/SummaryNode";
import { StatusBar } from "./StatusBar";
import { Navbar, type SavedSession } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { type Template } from "@/lib/templates";
import { HighlightedNodesProvider } from "@/context/HighlightedNodesContext";
import {
  AUTO_SAVE_KEY,
  SAVES_KEY,
  PROJECT_NAME_KEY,
  migrateLegacyFlowstateKeys,
} from "@/lib/flowstateStorage";

const nodeTypes = {
  ideaNode: IdeaNode,
  commentNode: CommentNode,
  actionItemNode: ActionItemNode,
  aiNode: AINode,
  connectorNode: ConnectorNode,
  groupNode: GroupNode,
  costNode: CostNode,
  riskNode: RiskNode,
  goalNode: GoalNode,
  decisionNode: DecisionNode,
  stakeholderNode: StakeholderNode,
  questionNode: QuestionNode,
  summaryNode: SummaryNode,
};

const defaultNodeData: Record<string, Record<string, unknown>> = {
  ideaNode: { label: "Idea", content: "" },
  commentNode: { label: "Comment", content: "" },
  actionItemNode: { label: "Action Item", content: "", assignee: "" },
  aiNode: { label: "Ask Gemini", prompt: "", output: "", isGenerating: false },
  costNode:        { label: "Cost", content: "" },
  riskNode:        { label: "Risk", content: "" },
  goalNode:        { label: "Goal", content: "" },
  decisionNode:    { label: "Decision", content: "", outcome: "Pending" },
  stakeholderNode: { label: "Stakeholder", content: "", role: "" },
  questionNode:    { label: "Question", content: "", answered: false },
  summaryNode:     { label: "Summary", content: "" },
  groupNode:       { label: "Group" },
};

const defaultNodeSize: Record<string, { width: number; height: number }> = {
  ideaNode:        { width: 220, height: 180 },
  commentNode:     { width: 220, height: 160 },
  actionItemNode:  { width: 220, height: 200 },
  aiNode:          { width: 240, height: 240 },
  costNode:        { width: 220, height: 160 },
  riskNode:        { width: 220, height: 160 },
  goalNode:        { width: 220, height: 160 },
  decisionNode:    { width: 220, height: 180 },
  stakeholderNode: { width: 220, height: 180 },
  questionNode:    { width: 220, height: 160 },
  summaryNode:     { width: 240, height: 180 },
  groupNode:       { width: 300, height: 200 },
};

function loadFromStorage(): { nodes: Node[]; edges: Edge[] } {
  if (typeof window === "undefined") return { nodes: [], edges: [] };
  try {
    const stored = localStorage.getItem(AUTO_SAVE_KEY);
    if (stored) {
      const { nodes, edges } = JSON.parse(stored);
      const sanitizedNodes = (nodes ?? []).map((n: Node) => {
        const size = defaultNodeSize[n.type ?? "ideaNode"] ?? { width: 220, height: 180 };
        const style = n.style && typeof n.style === "object" ? n.style : {};
        const hasSize = "width" in style || "height" in style;
        return {
          ...n,
          data: { ...n.data, isGenerating: false },
          style: hasSize ? style : { ...style, ...size },
        };
      });
      return { nodes: sanitizedNodes, edges: edges ?? [] };
    }
  } catch { /* ignore */ }
  return { nodes: [], edges: [] };
}

function saveAutoSave(nodes: Node[], edges: Edge[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ nodes, edges }));
  } catch { /* ignore */ }
}

const defaultEdgeOptions = {
  type: "default",
  animated: false,
  style: { stroke: "#a1a1aa", strokeWidth: 1.5, strokeDasharray: "6 3" },
};

type Snapshot = { nodes: Node[]; edges: Edge[] };

function FlowCanvasInner() {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    migrateLegacyFlowstateKeys();
    const { nodes: savedNodes, edges: savedEdges } = loadFromStorage();
    if (savedNodes.length > 0 || savedEdges.length > 0) {
      setNodes(savedNodes);
      setEdges(savedEdges);
    }
    const savedName = localStorage.getItem(PROJECT_NAME_KEY);
    if (savedName) setProjectName(savedName);
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const [projectName, setProjectName] = useState("Untitled Project");
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saved">("unsaved");
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isUndoRedo = useRef(false);

  const pushSnapshot = useCallback(() => {
    if (isUndoRedo.current) return;
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [nodes, edges]);

  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedPushSnapshot = useCallback(() => {
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(pushSnapshot, 300);
  }, [pushSnapshot]);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    isUndoRedo.current = true;
    redoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    const prev = undoStack.current.pop()!;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setTimeout(() => { isUndoRedo.current = false; }, 50);
  }, [nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    isUndoRedo.current = true;
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    const next = redoStack.current.pop()!;
    setNodes(next.nodes);
    setEdges(next.edges);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setTimeout(() => { isUndoRedo.current = false; }, 50);
  }, [nodes, edges, setNodes, setEdges]);

  const handleNew = useCallback(() => {
    pushSnapshot();
    setNodes([]);
    setEdges([]);
    const newName = "Untitled Project";
    setProjectName(newName);
    localStorage.setItem(PROJECT_NAME_KEY, newName);
    localStorage.removeItem(AUTO_SAVE_KEY);
    setSaveStatus("unsaved");
  }, [pushSnapshot, setNodes, setEdges]);

  const handleLoadTemplate = useCallback((template: Template) => {
    pushSnapshot();
    setNodes(template.nodes);
    setEdges(template.edges);
    const name = `${template.label} Template`;
    setProjectName(name);
    localStorage.setItem(PROJECT_NAME_KEY, name);
    setSaveStatus("unsaved");
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [pushSnapshot, setNodes, setEdges, fitView]);

  const handleProjectNameChange = useCallback((name: string) => {
    setProjectName(name);
    localStorage.setItem(PROJECT_NAME_KEY, name);
    setSaveStatus("unsaved");
  }, []);

  // named save — appends or updates a session in the saves list
  const handleSave = useCallback((name: string) => {
    try {
      const existing: SavedSession[] = JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]");
      const idx = existing.findIndex((s) => s.name === name);
      const session: SavedSession = {
        name,
        savedAt: new Date().toLocaleString(),
        canvas: { nodes, edges },
      };
      if (idx >= 0) { existing[idx] = session; } else { existing.unshift(session); }
      localStorage.setItem(SAVES_KEY, JSON.stringify(existing));
      // show "Saved" then revert to "Unsaved changes" after 3s
      setSaveStatus("saved");
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
      saveStatusTimer.current = setTimeout(() => setSaveStatus("unsaved"), 3000);
    } catch { /* ignore */ }
  }, [nodes, edges]);

  // load a saved session — also updates the project name
  const handleLoad = useCallback((session: SavedSession) => {
    try {
      const { nodes: savedNodes, edges: savedEdges } = session.canvas as { nodes: Node[]; edges: Edge[] };
      const sanitized = (savedNodes ?? []).map((n: Node) => {
        const size = defaultNodeSize[n.type ?? "ideaNode"] ?? { width: 220, height: 180 };
        const style = n.style && typeof n.style === "object" ? n.style : {};
        const hasSize = "width" in style || "height" in style;
        return {
          ...n,
          data: { ...n.data, isGenerating: false },
          style: hasSize ? style : { ...style, ...size },
        };
      });
      pushSnapshot();
      setNodes(sanitized);
      setEdges(savedEdges ?? []);
      setProjectName(session.name);
      localStorage.setItem(PROJECT_NAME_KEY, session.name);
      setSaveStatus("saved");
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
      saveStatusTimer.current = setTimeout(() => setSaveStatus("unsaved"), 3000);
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    } catch { /* ignore */ }
  }, [pushSnapshot, setNodes, setEdges, fitView]);

  // delete a named save from localStorage
  const handleDelete = useCallback((name: string) => {
    try {
      const existing: SavedSession[] = JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]");
      localStorage.setItem(SAVES_KEY, JSON.stringify(existing.filter((s) => s.name !== name)));
    } catch { /* ignore */ }
  }, []);

  const exportCanvas = useCallback(() => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowstate-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance;
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      debouncedPushSnapshot();
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, debouncedPushSnapshot]
  );

  // group nodes must sit behind all other nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !nodeTypes[type as keyof typeof nodeTypes]) return;
      const instance = flowInstanceRef.current;
      if (!instance) return;
      const position = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const size = defaultNodeSize[type] ?? { width: 220, height: 180 };
      const isGroup = type === "groupNode";
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        style: { width: size.width, height: size.height },
        data: { ...(defaultNodeData[type] ?? {}) },
        ...(isGroup ? { zIndex: -1 } : {}),
      };
      pushSnapshot();
      // groups go to the back of the array so they render behind other nodes
      setNodes((nds) => isGroup ? [newNode, ...nds] : nds.concat(newNode));
    },
    [setNodes, pushSnapshot]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // ── Analyze Selection ──────────────────────────────────────────────────────
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedNodes = nodes.filter((n) => n.selected);

  const handleAnalyzeSelection = useCallback(async () => {
    if (selectedNodes.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const prompt = buildAnalysisPrompt(selectedNodes as unknown as Array<{ id: string; type?: string; data?: Record<string, unknown> }>);
      const result = await geminiGenerate(prompt);
      setAnalyzeResult(result);
    } catch {
      setAnalyzeResult("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedNodes]);

  // mark unsaved whenever canvas content changes (skip on initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveStatus("unsaved");
    saveAutoSave(nodes, edges);
    debouncedPushSnapshot();
  }, [nodes, edges, hydrated, debouncedPushSnapshot]);

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <Navbar
        zoomLevel={zoom}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onNew={handleNew}
        onExport={exportCanvas}
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        saveStatus={saveStatus}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onLoadTemplate={handleLoadTemplate} />
        <HighlightedNodesProvider>
          <div className="relative flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              minZoom={0.25}
              maxZoom={2}
              className="bg-zinc-50"
            >
              <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="rgba(163, 163, 163, 0.15)" />
            </ReactFlow>
            <StatusBar />

            {/* Analyze Selection floating button + panel */}
            {selectedNodes.length >= 2 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                {analyzeResult && (
                  <div className="w-80 rounded-lg border border-purple-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">✨ AI Analysis</span>
                      <button type="button" onClick={() => setAnalyzeResult(null)} className="text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
                    </div>
                    <div className="max-h-48 overflow-y-auto px-3 py-2">
                      <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-wrap">{analyzeResult}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAnalyzeSelection}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 rounded-full border border-violet-600 bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-violet-700 disabled:opacity-60"
                >
                  {isAnalyzing ? "Analyzing..." : `✨ Analyze ${selectedNodes.length} selected nodes`}
                </button>
              </div>
            )}
          </div>
        </HighlightedNodesProvider>
      </div>
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
