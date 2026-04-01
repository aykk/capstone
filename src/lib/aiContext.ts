import type { Edge } from "reactflow";

// maps node type to a human-readable role label used in the prompt
const NODE_ROLE: Record<string, string> = {
  ideaNode:        "Idea",
  costNode:        "Cost / Budget",
  riskNode:        "Risk / Concern",
  goalNode:        "Goal / Success Metric",
  decisionNode:    "Decision",
  actionItemNode:  "Action Item",
  commentNode:     "Comment",
  noteNode:        "Note",
  stakeholderNode: "Stakeholder",
  questionNode:    "Open Question",
  summaryNode:     "Summary",
};

// maps parent → child edge meaning for richer prompt context
const RELATIONSHIP_LABEL: Record<string, Record<string, string>> = {
  ideaNode:   { riskNode: "carries the risk", costNode: "has the cost", goalNode: "aims to achieve", decisionNode: "informs the decision" },
  decisionNode: { actionItemNode: "requires the action" },
  commentNode:  { actionItemNode: "led to the action" },
};

interface RawNode {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
}

interface ConnectedNodeEntry {
  role: string;
  content: string;
  direction: "incoming" | "outgoing";
  relationshipLabel?: string;
}

// extracts the meaningful text content from any node's data
function extractContent(node: RawNode): string {
  const d = node.data ?? {};
  const parts: string[] = [];
  if (typeof d.content === "string" && d.content.trim()) parts.push(d.content.trim());
  if (typeof d.role === "string" && d.role.trim()) parts.push(`Role: ${d.role.trim()}`);
  if (typeof d.assignee === "string" && d.assignee.trim()) parts.push(`Assigned to: ${d.assignee.trim()}`);
  if (typeof d.outcome === "string" && d.outcome !== "Pending") parts.push(`Outcome: ${d.outcome}`);
  if (d.answered === true) parts.push("(answered)");
  return parts.join(" | ") || (typeof d.label === "string" ? d.label : "");
}

// builds a structured prompt string from all nodes connected to the AI node
export function buildContextPrompt(
  aiNodeId: string,
  userPrompt: string,
  allEdges: Edge[],
  nodeMap: Map<string, RawNode>
): string {
  const connected: ConnectedNodeEntry[] = [];

  for (const edge of allEdges) {
    if (edge.target === aiNodeId) {
      const node = nodeMap.get(edge.source);
      if (!node) continue;
      connected.push({
        role: NODE_ROLE[node.type ?? ""] ?? node.type ?? "Node",
        content: extractContent(node),
        direction: "incoming",
      });
    }
    if (edge.source === aiNodeId) {
      const node = nodeMap.get(edge.target);
      if (!node) continue;
      connected.push({
        role: NODE_ROLE[node.type ?? ""] ?? node.type ?? "Node",
        content: extractContent(node),
        direction: "outgoing",
      });
    }
  }

  // also capture relationships between connected nodes themselves
  const relationshipLines: string[] = [];
  for (const edge of allEdges) {
    if (edge.source === aiNodeId || edge.target === aiNodeId) continue;
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;
    const rel = RELATIONSHIP_LABEL[src.type ?? ""]?.[tgt.type ?? ""];
    if (rel) {
      const srcContent = extractContent(src);
      const tgtContent = extractContent(tgt);
      if (srcContent && tgtContent) {
        relationshipLines.push(`- "${srcContent}" (${NODE_ROLE[src.type ?? ""] ?? src.type}) ${rel}: "${tgtContent}" (${NODE_ROLE[tgt.type ?? ""] ?? tgt.type})`);
      }
    }
  }

  if (connected.length === 0) {
    return `You are a strategic advisor and meeting facilitator.\n\nTask: ${userPrompt}`;
  }

  const contextLines = connected
    .filter((c) => c.content)
    .map((c) => `- [${c.role}]: ${c.content}`)
    .join("\n");

  const relationshipSection = relationshipLines.length > 0
    ? `\n\nNode relationships:\n${relationshipLines.join("\n")}`
    : "";

  return `You are a strategic advisor and meeting facilitator.

Context from the canvas:
${contextLines}${relationshipSection}

Task: ${userPrompt || "Analyze the above context and provide a structured recommendation, highlighting key insights, risks, and suggested next steps."}`;
}

// builds a prompt for the "Analyze Selection" feature (multiple selected nodes)
export function buildAnalysisPrompt(selectedNodes: RawNode[]): string {
  const nodeDescriptions = selectedNodes
    .map((n) => {
      const role = NODE_ROLE[n.type ?? ""] ?? n.type ?? "Node";
      const content = extractContent(n);
      return content ? `- [${role}]: ${content}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `You are a strategic advisor and meeting facilitator.

The user has selected the following nodes from their canvas:
${nodeDescriptions || "(nodes have no content yet)"}

Provide a concise analysis covering:
1. Summary: What is the overall picture?
2. Critique: What are the gaps, risks, or weaknesses?
3. Suggestions: What are 2-3 concrete next steps or improvements?`;
}
