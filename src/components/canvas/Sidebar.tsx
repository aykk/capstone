"use client";

import { IconRobot, IconLink } from "@/components/icons";

const NODE_TYPES = [
  {
    type: "ideaNode",
    label: "Idea",
    description: "Capture a meeting idea",
    icon: () => <span className="text-base">💡</span>,
    accent: "border-l-blue-500",
  },
  {
    type: "commentNode",
    label: "Comment",
    description: "Clarify or annotate an idea",
    icon: () => <span className="text-base">💬</span>,
    accent: "border-l-yellow-400",
  },
  {
    type: "actionItemNode",
    label: "Action Item",
    description: "Something that needs to be done",
    icon: () => <span className="text-base">✅</span>,
    accent: "border-l-red-500",
  },
  {
    type: "connectorNode",
    label: "Connector",
    description: "Link multiple ideas together",
    icon: IconLink,
    accent: "border-l-zinc-400",
  },
  {
    type: "groupNode",
    label: "Group",
    description: "Group related nodes with a label",
    icon: () => <span className="text-base">▭</span>,
    accent: "border-l-zinc-300",
  },
  {
    type: "aiNode",
    label: "Ask Gemini",
    description: "Get AI help mid-meeting",
    icon: IconRobot,
    accent: "border-l-purple-500",
  },
] as const;

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex w-52 flex-col border-r border-zinc-200 bg-white">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Node Types
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2 pb-2">
        {NODE_TYPES.map(({ type, label, description, icon: Icon, accent }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`flex cursor-grab items-start gap-2.5 rounded-md border-l-2 px-2.5 py-2 transition-colors hover:bg-zinc-50 active:cursor-grabbing active:bg-zinc-100 ${accent}`}
          >
            <div className="mt-0.5 shrink-0">
              <Icon className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-zinc-700">{label}</div>
              <div className="text-[10px] text-zinc-400 leading-tight">{description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-100 px-4 py-2.5">
        <span className="text-[11px] text-zinc-400">Drag nodes onto the canvas</span>
      </div>
    </aside>
  );
}
