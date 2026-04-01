"use client";

import { useState, useRef, useEffect } from "react";
import { IconMeeting, IconUndo, IconRedo, IconZoomIn, IconZoomOut, IconSave, IconFolderOpen, IconTrash } from "@/components/icons";

const SAVES_KEY = "meetingflow-saves";
const PROJECT_NAME_KEY = "meetingflow-project-name";

export interface SavedSession {
  name: string;
  savedAt: string;
  canvas: unknown;
}

interface NavbarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: (name: string) => void;
  onLoad: (session: SavedSession) => void;
  onDelete: (name: string) => void;
  onNew: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  saveStatus: "unsaved" | "saved";
}

function getSaves(): SavedSession[] {
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function Navbar({ zoomLevel, onZoomIn, onZoomOut, onUndo, onRedo, canUndo, canRedo, onSave, onLoad, onDelete, onNew, projectName, onProjectNameChange, saveStatus }: NavbarProps) {
  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState(projectName);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [saves, setSaves] = useState<SavedSession[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadMenuRef = useRef<HTMLDivElement>(null);

  // keep local input in sync when parent changes the name (e.g. on load)
  useEffect(() => { setLocalName(projectName); }, [projectName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // close load menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (loadMenuRef.current && !loadMenuRef.current.contains(e.target as Node)) {
        setShowLoadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const commitName = () => {
    setEditing(false);
    const trimmed = localName.trim() || "Untitled Meeting";
    setLocalName(trimmed);
    onProjectNameChange(trimmed);
  };

  const handleSave = () => { onSave(projectName); };

  const handleOpenLoad = () => {
    setSaves(getSaves());
    setShowLoadMenu((v) => !v);
  };

  return (
    <nav className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
      {/* left: branding + meeting title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IconMeeting className="h-5 w-5 text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900">MeetingFlow</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        {editing ? (
          <input
            ref={inputRef}
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") commitName(); }}
            className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded px-1.5 py-0.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
            title="Click to rename this meeting"
          >
            {projectName}
          </button>
        )}
        {/* save status badge */}
        <span className={`text-[11px] transition-colors duration-300 ${
          saveStatus === "saved" ? "text-green-500" : "text-zinc-300"
        }`}>
          {saveStatus === "saved" ? "✓ Saved" : "Unsaved changes"}
        </span>
      </div>

      {/* center: undo, redo, zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          title="Undo"
        >
          <IconUndo className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          title="Redo"
        >
          <IconRedo className="h-4 w-4" />
        </button>
        <div className="mx-2 h-4 w-px bg-zinc-200" />
        <button onClick={onZoomOut} className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700" title="Zoom out">
          <IconZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] text-center text-xs tabular-nums text-zinc-500">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button onClick={onZoomIn} className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700" title="Zoom in">
          <IconZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* right: save + load */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          title="Start a new blank meeting"
        >
          + New
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          title="Save current meeting"
        >
          <IconSave className="h-3 w-3" />
          Save
        </button>

        <div className="relative" ref={loadMenuRef}>
          <button
            onClick={handleOpenLoad}
            className="flex items-center gap-1.5 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            title="Load a saved meeting"
          >
            <IconFolderOpen className="h-3 w-3" />
            Load
          </button>

          {showLoadMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg">
              <div className="px-3 py-2 border-b border-zinc-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Saved Meetings</span>
              </div>
              {saves.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-zinc-400">No saved meetings yet</div>
              ) : (
                <div className="max-h-60 overflow-y-auto py-1">
                  {saves.map((s, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 transition-colors hover:bg-zinc-50 group">
                      <button
                        onClick={() => { onLoad(s); setShowLoadMenu(false); }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-[13px] font-medium text-zinc-700 truncate">{s.name}</div>
                        <div className="text-[10px] text-zinc-400">{s.savedAt}</div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(s.name);
                          setSaves((prev) => prev.filter((x) => x.name !== s.name));
                        }}
                        className="shrink-0 rounded p-1 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                        title="Delete this saved meeting"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
