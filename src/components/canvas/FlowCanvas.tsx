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
import "reactflow/dist/style.css";
import { IdeaNode } from "./nodes/IdeaNode";
import { CommentNode } from "./nodes/CommentNode";
import { ActionItemNode } from "./nodes/ActionItemNode";
import { AINode } from "./nodes/AINode";
import { ConnectorNode } from "./nodes/ConnectorNode";
import { GroupNode } from "./nodes/GroupNode";
import { StatusBar } from "./StatusBar";
import { Navbar, type SavedSession } from "./Navbar";
import { Sidebar } from "./Sidebar";

const AUTO_SAVE_KEY = "meetingflow-canvas-autosave";
const SAVES_KEY = "meetingflow-saves";

const nodeTypes = {
  ideaNode: IdeaNode,
  commentNode: CommentNode,
  actionItemNode: ActionItemNode,
  aiNode: AINode,
  connectorNode: ConnectorNode,
  groupNode: GroupNode,
};

const defaultNodeData: Record<string, Record<string, unknown>> = {
  ideaNode: { label: "Idea", content: "" },
  commentNode: { label: "Comment", content: "" },
  actionItemNode: { label: "Action Item", content: "", assignee: "" },
  aiNode: { label: "Ask Gemini", prompt: "", output: "", isGenerating: false },
  groupNode: { label: "Group", },
};

const defaultNodeSize: Record<string, { width: number; height: number }> = {
  ideaNode: { width: 220, height: 180 },
  commentNode: { width: 220, height: 160 },
  actionItemNode: { width: 220, height: 200 },
  aiNode: { width: 240, height: 240 },
  groupNode: { width: 300, height: 200 },
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

export interface FlowCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel: number;
}

function FlowCanvasInner() {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const { nodes: initialNodes, edges: initialEdges } = loadFromStorage();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();

  const [projectName, setProjectName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("meetingflow-project-name") ?? "Untitled Meeting";
    }
    return "Untitled Meeting";
  });
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
    const newName = "Untitled Meeting";
    setProjectName(newName);
    localStorage.setItem("meetingflow-project-name", newName);
    localStorage.removeItem(AUTO_SAVE_KEY);
    setSaveStatus("unsaved");
  }, [pushSnapshot, setNodes, setEdges]);

  const handleProjectNameChange = useCallback((name: string) => {
    setProjectName(name);
    localStorage.setItem("meetingflow-project-name", name);
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
      // update the project name to match the loaded session
      setProjectName(session.name);
      localStorage.setItem("meetingflow-project-name", session.name);
      setSaveStatus("saved");
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
      saveStatusTimer.current = setTimeout(() => setSaveStatus("unsaved"), 3000);
    } catch { /* ignore */ }
  }, [pushSnapshot, setNodes, setEdges]);

  // delete a named save from localStorage
  const handleDelete = useCallback((name: string) => {
    try {
      const existing: SavedSession[] = JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]");
      localStorage.setItem(SAVES_KEY, JSON.stringify(existing.filter((s) => s.name !== name)));
    } catch { /* ignore */ }
  }, []);

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

  // mark unsaved whenever canvas content changes (skip on initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveStatus("unsaved");
    saveAutoSave(nodes, edges);
    debouncedPushSnapshot();
  }, [nodes, edges, debouncedPushSnapshot]);

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
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        saveStatus={saveStatus}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
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
        </div>
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
