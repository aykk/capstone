"use client";

import { useState, useRef, useEffect } from "react";
import { IconFlowstate, IconUndo, IconRedo, IconZoomIn, IconZoomOut, IconPlay, IconDownload } from "@/components/icons";

interface NavbarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Navbar({ zoomLevel, onZoomIn, onZoomOut, onUndo, onRedo, canUndo, canRedo }: NavbarProps) {
  const [projectName, setProjectName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("flowstate-project-name") ?? "Untitled Project";
    }
    return "Untitled Project";
  });
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitName = () => {
    setEditing(false);
    const trimmed = projectName.trim() || "Untitled Project";
    setProjectName(trimmed);
    localStorage.setItem("flowstate-project-name", trimmed);
  };

  return (
    <nav className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
      {/* left: branding + project title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IconFlowstate className="h-5 w-5 text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900">Flowstate</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        {editing ? (
          <input
            ref={inputRef}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") commitName(); }}
            className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded px-1.5 py-0.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* center: undo, redo, zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
        >
          <IconUndo className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
        >
          <IconRedo className="h-4 w-4" />
        </button>
        <div className="mx-2 h-4 w-px bg-zinc-200" />
        <button
          onClick={onZoomOut}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <IconZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] text-center text-xs tabular-nums text-zinc-500">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <IconZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* right: run + export */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
          <IconPlay className="h-3 w-3" />
          Run
        </button>
        <button className="flex items-center gap-1.5 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800">
          <IconDownload className="h-3 w-3" />
          Export
        </button>
      </div>
    </nav>
  );
}
