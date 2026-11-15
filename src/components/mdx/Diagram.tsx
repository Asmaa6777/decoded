import { useMemo } from "react";
import { ReactFlow, Handle, MarkerType, Position, type Edge as RFEdge, type Node as RFNode } from "@xyflow/react";
import dagre from "@dagrejs/dagre";

/* ============================================================
   Diagram — static educational diagrams (pipelines, flowcharts).
   Wraps ReactFlow with dagre auto-layout, brand-tokened nodes
   and edges, and all interactivity stripped. Use this for any
   non-stateful conceptual graph; use AutomatonDiagram for actual
   state machines the reader needs to step through.
   ============================================================ */

type DiagramNodeKind = "source" | "sink" | "default";

type DiagramNode = {
  id: string;
  label: string;
  type?: "source" | "sink";
};

type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  back?: boolean;
  // Back edges loop around the right side unless told otherwise; give
  // two loops on the same side different offsets so they don't overlap.
  side?: "left" | "right";
  offset?: number;
};

type DiagramProps = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  direction?: "LR" | "TB";
};

const DIAGRAM_NODE_W = 220;
const DIAGRAM_NODE_H = 52;

function DiagramBaseNode({
  data,
}: {
  data: { label: string; kind: DiagramNodeKind; direction: "LR" | "TB" };
}) {
  const target = data.direction === "TB" ? Position.Top : Position.Left;
  const source = data.direction === "TB" ? Position.Bottom : Position.Right;

  const tintClass =
    data.kind === "source"
      ? "border-neon"
      : data.kind === "sink"
        ? "border-mint"
        : "border-border";

  return (
    <div
      style={{ width: DIAGRAM_NODE_W, height: DIAGRAM_NODE_H }}
      className={`flex items-center justify-center border ${tintClass} bg-card rounded-sm px-4 py-2 font-mono text-sm text-foreground tracking-wide whitespace-nowrap`}
    >
      <Handle type="target" position={target} />
      {data.label}
      <Handle type="source" position={source} />
      {data.direction === "TB" && (
        <>
          <Handle id="loop-out" type="source" position={Position.Right} />
          <Handle id="loop-in" type="target" position={Position.Right} />
          <Handle id="loop-out-left" type="source" position={Position.Left} />
          <Handle id="loop-in-left" type="target" position={Position.Left} />
        </>
      )}
    </div>
  );
}

const diagramNodeTypes = { base: DiagramBaseNode };

function layoutDiagram(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: "LR" | "TB"
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach((n) =>
    g.setNode(n.id, { width: DIAGRAM_NODE_W, height: DIAGRAM_NODE_H })
  );
  // Back edges loop around the side, so they don't affect the layout.
  edges.filter((e) => !e.back).forEach((e) => g.setEdge(e.from, e.to));
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - DIAGRAM_NODE_W / 2,
        y: pos.y - DIAGRAM_NODE_H / 2,
      },
    };
  });
}

export function Diagram({ nodes, edges, direction = "LR" }: DiagramProps) {
  const layouted = useMemo(
    () => layoutDiagram(nodes, edges, direction),
    [nodes, edges, direction]
  );

  const rfNodes: RFNode[] = layouted.map((n) => ({
    id: n.id,
    position: n.position,
    type: "base",
    data: { label: n.label, kind: n.type ?? "default", direction },
    draggable: false,
    selectable: false,
  }));

  const rfEdges: RFEdge[] = edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    label: e.label,
    type: e.back ? "smoothstep" : "default",
    sourceHandle: e.back ? (e.side === "left" ? "loop-out-left" : "loop-out") : undefined,
    targetHandle: e.back ? (e.side === "left" ? "loop-in-left" : "loop-in") : undefined,
    ...(e.back ? { pathOptions: { offset: e.offset ?? 60 } } : {}),
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--foreground))" },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 2,
  }));

  // Auto-fit container height from the laid-out bounding box.
  const padding = 40;
  const containerHeight = layouted.reduce(
    (max, n) => Math.max(max, n.position.y + DIAGRAM_NODE_H),
    0
  ) + padding;

  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div style={{ height: containerHeight, width: "100%" }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={diagramNodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.4}
          maxZoom={1}
        />
      </div>
    </div>
  );
}
