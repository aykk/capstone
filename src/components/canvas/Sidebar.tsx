"use client";

import { TEMPLATES, type Template } from "@/lib/templates";

const NODE_GROUPS = [
  {
    label: "Capture",
    nodes: [
      { type: "ideaNode",        label: "Idea",        description: "Capture a meeting idea",          accent: "border-l-blue-600"  },
      { type: "commentNode",     label: "Comment",     description: "Clarify or annotate an idea",     accent: "border-l-blue-400"  },
      { type: "stakeholderNode", label: "Stakeholder", description: "Map people and their interests",  accent: "border-l-blue-500"  },
      { type: "summaryNode",     label: "Summary",     description: "AI-generated or manual summary",  accent: "border-l-blue-300"  },
    ],
  },
  {
    label: "Evaluate",
    nodes: [
      { type: "costNode",     label: "Cost",     description: "Estimate costs or budget",       accent: "border-l-amber-500" },
      { type: "riskNode",     label: "Risk",     description: "Identify risks or blockers",     accent: "border-l-amber-700" },
      { type: "questionNode", label: "Question", description: "Track open questions",           accent: "border-l-amber-500" },
    ],
  },
  {
    label: "Decide & Act",
    nodes: [
      { type: "goalNode",       label: "Goal",        description: "Define a success metric",      accent: "border-l-red-400" },
      { type: "decisionNode",   label: "Decision",    description: "Track a decision outcome",     accent: "border-l-red-500" },
      { type: "actionItemNode", label: "Action Item", description: "Something that needs to be done", accent: "border-l-red-500" },
    ],
  },
  {
    label: "Canvas",
    nodes: [
      { type: "connectorNode", label: "Connector", description: "Link multiple ideas together",     accent: "border-l-zinc-400" },
      { type: "groupNode",     label: "Group",     description: "Group related nodes with a label", accent: "border-l-zinc-300" },
    ],
  },
  {
    label: "AI",
    nodes: [
      { type: "aiNode", label: "Ask Gemini", description: "Get AI help mid-meeting", accent: "border-l-violet-600" },
    ],
  },
] as const;

interface SidebarProps {
  onLoadTemplate: (template: Template) => void;
}

export function Sidebar({ onLoadTemplate }: SidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex w-52 flex-col border-r border-zinc-200 bg-white overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Templates</span>
      </div>
      <div className="flex flex-col gap-1 px-2 pb-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onLoadTemplate(template)}
            className="flex flex-col rounded-md border-l-2 border-l-violet-500 px-2.5 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
          >
            <div className="text-[13px] font-medium text-zinc-700">{template.label}</div>
            <div className="text-[10px] text-zinc-400 leading-tight">{template.description}</div>
          </button>
        ))}
      </div>

      {NODE_GROUPS.map((group, i) => (
        <div key={group.label}>
          <div className={`px-4 pb-2 ${i === 0 ? "border-t border-zinc-100 pt-3" : "pt-3"}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{group.label}</span>
          </div>
          <div className="flex flex-col gap-1 px-2 pb-1">
            {group.nodes.map(({ type, label, description, accent }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                className={`flex cursor-grab flex-col rounded-md border-l-2 px-2.5 py-2 transition-colors hover:bg-zinc-50 active:cursor-grabbing active:bg-zinc-100 ${accent}`}
              >
                <div className="text-[13px] font-medium text-zinc-700">{label}</div>
                <div className="text-[10px] text-zinc-400 leading-tight">{description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="pb-4" />
    </aside>
  );
}
