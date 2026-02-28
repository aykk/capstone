"use client";

import { useCallback, useState } from "react";
import { Navbar } from "@/components/canvas/Navbar";
import { Sidebar } from "@/components/canvas/Sidebar";
import { FlowCanvas, type FlowCanvasHandle } from "@/components/canvas/FlowCanvas";

export default function Home() {
  const [handle, setHandle] = useState<FlowCanvasHandle>({
    zoomIn: () => {},
    zoomOut: () => {},
    undo: () => {},
    redo: () => {},
    canUndo: false,
    canRedo: false,
    zoomLevel: 1,
  });

  const onStateChange = useCallback((h: FlowCanvasHandle) => {
    setHandle(h);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <Navbar
        zoomLevel={handle.zoomLevel}
        onZoomIn={handle.zoomIn}
        onZoomOut={handle.zoomOut}
        onUndo={handle.undo}
        onRedo={handle.redo}
        canUndo={handle.canUndo}
        canRedo={handle.canRedo}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1">
          <FlowCanvas onStateChange={onStateChange} />
        </main>
      </div>
    </div>
  );
}
