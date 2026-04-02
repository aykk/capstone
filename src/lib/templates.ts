import type { Node, Edge } from "reactflow";

export interface Template {
  id: string;
  label: string;
  description: string;
  icon: string;
  nodes: Node[];
  edges: Edge[];
}

const edgeStyle = { stroke: "#a1a1aa", strokeWidth: 1.5, strokeDasharray: "6 3" };

export const TEMPLATES: Template[] = [
  {
    id: "decision",
    label: "Decision",
    description: "Evaluate an idea with costs, risks, goals, and an AI advisor",
    icon: "📌",
    nodes: [
      { id: "t-idea", type: "ideaNode",     position: { x: 60,  y: 160 }, style: { width: 220, height: 160 }, data: { label: "Idea", content: "" } },
      { id: "t-cost", type: "costNode",     position: { x: 340, y: 60  }, style: { width: 220, height: 160 }, data: { label: "Cost", content: "" } },
      { id: "t-risk", type: "riskNode",     position: { x: 340, y: 260 }, style: { width: 220, height: 160 }, data: { label: "Risk", content: "" } },
      { id: "t-goal", type: "goalNode",     position: { x: 340, y: 460 }, style: { width: 220, height: 160 }, data: { label: "Goal", content: "" } },
      { id: "t-dec",  type: "decisionNode", position: { x: 620, y: 260 }, style: { width: 220, height: 180 }, data: { label: "Decision", content: "", outcome: "Pending" } },
      { id: "t-ai",   type: "aiNode",       position: { x: 900, y: 220 }, style: { width: 240, height: 260 }, data: { label: "Ask Gemini", prompt: "Analyze this decision based on the idea, costs, risks, and goals. Provide a structured recommendation.", output: "", isGenerating: false } },
    ],
    edges: [
      { id: "te-1", source: "t-idea", target: "t-cost", style: edgeStyle },
      { id: "te-2", source: "t-idea", target: "t-risk", style: edgeStyle },
      { id: "te-3", source: "t-idea", target: "t-goal", style: edgeStyle },
      { id: "te-4", source: "t-cost", target: "t-dec",  style: edgeStyle },
      { id: "te-5", source: "t-risk", target: "t-dec",  style: edgeStyle },
      { id: "te-6", source: "t-goal", target: "t-dec",  style: edgeStyle },
      { id: "te-7", source: "t-cost", target: "t-ai",   style: edgeStyle },
      { id: "te-8", source: "t-risk", target: "t-ai",   style: edgeStyle },
      { id: "te-9", source: "t-goal", target: "t-ai",   style: edgeStyle },
    ],
  },
  {
    id: "session",
    label: "Session",
    description: "Agenda, discussion threads, action items, and an AI summary node",
    icon: "📅",
    nodes: [
      { id: "m-agenda",  type: "ideaNode",      position: { x: 60,  y: 80  }, style: { width: 220, height: 160 }, data: { label: "Agenda", content: "" } },
      { id: "m-disc1",   type: "commentNode",   position: { x: 340, y: 40  }, style: { width: 220, height: 160 }, data: { label: "Discussion Point 1", content: "" } },
      { id: "m-disc2",   type: "commentNode",   position: { x: 340, y: 230 }, style: { width: 220, height: 160 }, data: { label: "Discussion Point 2", content: "" } },
      { id: "m-action1", type: "actionItemNode", position: { x: 620, y: 40  }, style: { width: 220, height: 200 }, data: { label: "Action Item", content: "", assignee: "" } },
      { id: "m-action2", type: "actionItemNode", position: { x: 620, y: 270 }, style: { width: 220, height: 200 }, data: { label: "Action Item", content: "", assignee: "" } },
      { id: "m-ai",      type: "aiNode",         position: { x: 900, y: 140 }, style: { width: 240, height: 260 }, data: { label: "Ask Gemini", prompt: "Summarize this session: key decisions and suggested follow-up action items.", output: "", isGenerating: false } },
    ],
    edges: [
      { id: "me-1", source: "m-agenda",  target: "m-disc1",   style: edgeStyle },
      { id: "me-2", source: "m-agenda",  target: "m-disc2",   style: edgeStyle },
      { id: "me-3", source: "m-disc1",   target: "m-action1", style: edgeStyle },
      { id: "me-4", source: "m-disc2",   target: "m-action2", style: edgeStyle },
      { id: "me-5", source: "m-disc1",   target: "m-ai",      style: edgeStyle },
      { id: "me-6", source: "m-disc2",   target: "m-ai",      style: edgeStyle },
      { id: "me-7", source: "m-action1", target: "m-ai",      style: edgeStyle },
      { id: "me-8", source: "m-action2", target: "m-ai",      style: edgeStyle },
    ],
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    description: "Expand a central idea with branching thoughts and AI suggestions",
    icon: "🧠",
    nodes: [
      { id: "b-center", type: "ideaNode", position: { x: 300, y: 200 }, style: { width: 220, height: 160 }, data: { label: "Central Idea", content: "" } },
      { id: "b-idea1",  type: "ideaNode", position: { x: 620, y: 60  }, style: { width: 220, height: 160 }, data: { label: "Branch Idea 1", content: "" } },
      { id: "b-idea2",  type: "ideaNode", position: { x: 620, y: 260 }, style: { width: 220, height: 160 }, data: { label: "Branch Idea 2", content: "" } },
      { id: "b-idea3",  type: "ideaNode", position: { x: 620, y: 460 }, style: { width: 220, height: 160 }, data: { label: "Branch Idea 3", content: "" } },
      { id: "b-ai",     type: "aiNode",   position: { x: 940, y: 220 }, style: { width: 240, height: 260 }, data: { label: "Ask Gemini", prompt: "Based on these ideas, suggest additional branches, identify patterns, and recommend which ideas to prioritize.", output: "", isGenerating: false } },
    ],
    edges: [
      { id: "be-1", source: "b-center", target: "b-idea1", style: edgeStyle },
      { id: "be-2", source: "b-center", target: "b-idea2", style: edgeStyle },
      { id: "be-3", source: "b-center", target: "b-idea3", style: edgeStyle },
      { id: "be-4", source: "b-idea1",  target: "b-ai",    style: edgeStyle },
      { id: "be-5", source: "b-idea2",  target: "b-ai",    style: edgeStyle },
      { id: "be-6", source: "b-idea3",  target: "b-ai",    style: edgeStyle },
    ],
  },
];
