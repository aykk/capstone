"use client";

import { useNodes, useEdges } from "reactflow";

// shows node and connection count at the bottom of the canvas
export function StatusBar() {
  const nodes = useNodes();
  const edges = useEdges();

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-sm">
        <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
        <span className="text-[11px]  ">
          {nodes.length} {nodes.length === 1 ? "node" : "nodes"} &middot;{" "}
          {edges.length} {edges.length === 1 ? "connection" : "connections"}
        </span>
      </div>
    </div>
  );
}
