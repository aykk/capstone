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
import { TextNode } from "./nodes/TextNode";
import { ImageNode } from "./nodes/ImageNode";
import { AINode } from "./nodes/AINode";
import { LogicNode } from "./nodes/LogicNode";
import { ConnectorNode } from "./nodes/ConnectorNode";
import { NoteNode } from "./nodes/NoteNode";
import { CommentNode } from "./nodes/CommentNode";
import { StatusBar } from "./StatusBar";

const STORAGE_KEY = "flowstate-canvas-v3";

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  aiNode: AINode,
  logicNode: LogicNode,
  connectorNode: ConnectorNode,
  noteNode: NoteNode,
  commentNode: CommentNode,
};

// default data for each node type when dropped onto the canvas
const defaultNodeData: Record<string, Record<string, unknown>> = {
  textNode: { label: "Text Node", content: "" },
  imageNode: { label: "Image Node", src: "" },
  aiNode: { label: "AI Node", prompt: "", output: "", isGenerating: false },
  logicNode: { label: "Logic Node", option: "once" },
  connectorNode: {},
  noteNode: { label: "Note", content: "" },
  commentNode: { label: "Comment", content: "" },
};

const defaultNodeSize: Record<string, { width: number; height: number }> = {
  textNode: { width: 220, height: 180 },
  imageNode: { width: 220, height: 200 },
  aiNode: { width: 240, height: 240 },
  logicNode: { width: 180, height: 100 },
  connectorNode: { width: 32, height: 32 },
  noteNode: { width: 220, height: 180 },
  commentNode: { width: 220, height: 180 },
};

// read saved nodes and edges from the browser so layout survives refresh
function loadFromStorage(): { nodes: Node[]; edges: Edge[] } {
  if (typeof window === "undefined") return { nodes: [], edges: [] };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { nodes, edges } = JSON.parse(stored);
      const sanitizedNodes = (nodes ?? []).map((n: Node) => {
        const size = defaultNodeSize[n.type ?? "textNode"] ?? { width: 180, height: 55 };
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
  } catch {
    // ignore parse errors
  }
  return { nodes: [], edges: [] };
}

// write nodes and edges to the browser so they persist
function saveToStorage(nodes: Node[], edges: Edge[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch {
    // ignore
  }
}

// make the connecting lines dashed instead of solid
const defaultEdgeOptions = {
  type: "default",
  animated: false,
  style: { stroke: "#a1a1aa", strokeWidth: 1.5, strokeDasharray: "6 3" },
};

// keeps a copy of the canvas so you can undo and redo changes
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

function FlowCanvasInner({ onStateChange }: { onStateChange: (handle: FlowCanvasHandle) => void }) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const { nodes: initialNodes, edges: initialEdges } = loadFromStorage();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();

  // stores past and future states for undo and redo
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

  // waits a moment before saving so dragging doesn't create too many steps
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

  // sends zoom and undo/redo controls up to the navbar
  useEffect(() => {
    onStateChange({
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
      undo: handleUndo,
      redo: handleRedo,
      canUndo,
      canRedo,
      zoomLevel: zoom,
    });
  }, [zoom, canUndo, canRedo, zoomIn, zoomOut, handleUndo, handleRedo, onStateChange]);

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

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !nodeTypes[type as keyof typeof nodeTypes]) return;
      const instance = flowInstanceRef.current;
      if (!instance) return;
      const position = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const size = defaultNodeSize[type] ?? { width: 180, height: 55 };
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        style: { width: size.width, height: size.height },
        data: { ...(defaultNodeData[type] ?? {}) },
      };
      pushSnapshot();
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, pushSnapshot]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // save to browser storage whenever the canvas changes
  useEffect(() => {
    saveToStorage(nodes, edges);
    debouncedPushSnapshot();
  }, [nodes, edges, debouncedPushSnapshot]);

  return (
    <div className="relative h-full w-full">
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
  );
}

// wraps the canvas so nodes inside can talk to the flow
export function FlowCanvas({ onStateChange }: { onStateChange: (handle: FlowCanvasHandle) => void }) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner onStateChange={onStateChange} />
    </ReactFlowProvider>
  );
}
