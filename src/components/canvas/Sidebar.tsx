"use client";

import { IconText, IconImage, IconLogic, IconNote, IconComment, IconRobot, IconLink } from "@/components/icons";

// all available node types for the sidebar
const NODE_TYPES = [
  { type: "textNode", label: "Text Node", icon: IconText },
  { type: "imageNode", label: "Image Node", icon: IconImage },
  { type: "aiNode", label: "AI Node", icon: IconRobot },
  { type: "logicNode", label: "Logic Node", icon: IconLogic },
  { type: "connectorNode", label: "Connector", icon: IconLink },
  { type: "noteNode", label: "Note Node", icon: IconNote },
  { type: "commentNode", label: "Comment", icon: IconComment },
] as const;

export function Sidebar() {
  // store which node type is being dragged so the canvas knows what to create
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex w-48 flex-col border-r border-zinc-200 bg-white">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Node Library
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-2 pb-2">
        {NODE_TYPES.map(({ type, label, icon: Icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex cursor-grab items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-zinc-50 active:cursor-grabbing active:bg-zinc-100"
          >
            <Icon className="h-4 w-4 text-zinc-500" />
            <span className="text-[13px] text-zinc-700">{label}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-100 px-4 py-2.5">
        <span className="text-[11px] text-zinc-400">Drag nodes onto the canvas</span>
      </div>
    </aside>
  );
}
