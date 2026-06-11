'use client';

import React from 'react';

// ============================================
// Types
// ============================================

interface TopologyNode {
  id: string;
  name: string;
  mbti: string;
  weapon: string;
  thesis: string;
  color: string;
  x: number;
  y: number;
}

interface TopologyEdge {
  source: string;
  target: string;
  type: 'clash' | 'exploit' | 'deconstruct';
  label: string;
}

interface ConflictTopology {
  quadrants: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

interface TopologyChartProps {
  topology: ConflictTopology;
}

// ============================================
// Constants
// ============================================

const SVG_W = 650;
const SVG_H = 460;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

const NODE_W = 146;
const NODE_H = 72;

const COLORS = {
  axis: '#c9c5bc',
  axisLabel: 'rgba(80,60,30,0.35)',
  quadrant: 'rgba(80,60,30,0.25)',
  clash: '#8a3c3c',
  link: '#b8963a',
  bg: '#f5f0e6',
};

// ============================================
// Component
// ============================================

export default function TopologyChart({ topology }: TopologyChartProps) {
  const { quadrants, nodes, edges } = topology;

  // Build node lookup for edge rendering
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="w-full flex justify-center my-4">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        className="max-w-full h-auto"
        style={{ background: COLORS.bg, borderRadius: 4 }}
      >
        {/* Background */}
        <rect width={SVG_W} height={SVG_H} fill={COLORS.bg} />

        {/* Cross axes */}
        {/* Horizontal */}
        <line x1={20} y1={CY} x2={SVG_W - 20} y2={CY} stroke={COLORS.axis} strokeWidth={0.8} />
        {/* Vertical */}
        <line x1={CX} y1={20} x2={CX} y2={SVG_H - 20} stroke={COLORS.axis} strokeWidth={0.8} />

        {/* Axis end labels */}
        <text
          x={28}
          y={CY + 16}
          fill={COLORS.axisLabel}
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
        >
          集权控序
        </text>
        <text
          x={SVG_W - 72}
          y={CY + 16}
          fill={COLORS.axisLabel}
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
        >
          分权自由
        </text>
        <text
          x={CX + 6}
          y={30}
          fill={COLORS.axisLabel}
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
        >
          精神道德
        </text>
        <text
          x={CX + 6}
          y={SVG_H - 14}
          fill={COLORS.axisLabel}
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
        >
          功利效率
        </text>

        {/* Quadrant labels */}
        <text
          x={CX / 2}
          y={CY / 2 - 8}
          textAnchor="middle"
          fill={COLORS.quadrant}
          fontSize={10}
          fontFamily="'Noto Serif SC', serif"
          fontWeight={600}
        >
          {quadrants.topLeft}
        </text>
        <text
          x={CX + CX / 2}
          y={CY / 2 - 8}
          textAnchor="middle"
          fill={COLORS.quadrant}
          fontSize={10}
          fontFamily="'Noto Serif SC', serif"
          fontWeight={600}
        >
          {quadrants.topRight}
        </text>
        <text
          x={CX / 2}
          y={CY + CY / 2 + 16}
          textAnchor="middle"
          fill={COLORS.quadrant}
          fontSize={10}
          fontFamily="'Noto Serif SC', serif"
          fontWeight={600}
        >
          {quadrants.bottomLeft}
        </text>
        <text
          x={CX + CX / 2}
          y={CY + CY / 2 + 16}
          textAnchor="middle"
          fill={COLORS.quadrant}
          fontSize={10}
          fontFamily="'Noto Serif SC', serif"
          fontWeight={600}
        >
          {quadrants.bottomRight}
        </text>

        {/* Edges (drawn first, behind nodes) */}
        {edges.map((edge, idx) => {
          const srcNode = nodeMap.get(edge.source);
          const tgtNode = nodeMap.get(edge.target);
          if (!srcNode || !tgtNode) return null;

          const isClash = edge.type === 'clash';
          const lineColor = isClash ? COLORS.clash : COLORS.link;
          const lineWidth = isClash ? 1.8 : 1.2;

          // Calculate midpoint for label
          const mx = (srcNode.x + tgtNode.x) / 2;
          const my = (srcNode.y + tgtNode.y) / 2;

          return (
            <g key={`edge-${idx}`}>
              <line
                x1={srcNode.x}
                y1={srcNode.y}
                x2={tgtNode.x}
                y2={tgtNode.y}
                stroke={lineColor}
                strokeWidth={lineWidth}
                strokeDasharray={isClash ? 'none' : '6,3'}
              />
              {/* Arrow marker at target */}
              <circle cx={tgtNode.x} cy={tgtNode.y} r={3} fill={lineColor} />
              {/* Label with background rect */}
              <rect
                x={mx - 36}
                y={my - 8}
                width={72}
                height={16}
                rx={2}
                fill={COLORS.bg}
                stroke={lineColor}
                strokeWidth={0.4}
                opacity={0.9}
              />
              <text
                x={mx}
                y={my + 3}
                textAnchor="middle"
                fill={lineColor}
                fontSize={9}
                fontFamily="'Noto Sans SC', sans-serif"
                fontWeight={500}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={`node-${node.id}`}>
            {/* Card background */}
            <rect
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill="#fff"
              stroke={node.color}
              strokeWidth={1.2}
            />
            {/* 顶部色条 */}
            <rect
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill="none"
              stroke={node.color}
              strokeWidth={1.2}
            />
            <rect
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={3}
              rx={1.5}
              fill={node.color}
            />
            {/* 人物名 */}
            <text
              x={node.x}
              y={node.y - 14}
              textAnchor="middle"
              fill="#2a2824"
              fontSize={13}
              fontFamily="'Noto Serif SC', serif"
              fontWeight={700}
            >
              {node.name}
            </text>
            {/* 口头禅（单行简洁） */}
            <text
              x={node.x}
              y={node.y + 6}
              textAnchor="middle"
              fill="#6a6458"
              fontSize={8.5}
              fontFamily="'Noto Sans SC', sans-serif"
            >
              「{node.weapon.length > 18 ? node.weapon.slice(0, 18) + '…' : node.weapon}」
            </text>
            {/* MBTI 标签 */}
            <rect
              x={node.x - node.mbti.length * 3.5 - 5}
              y={node.y + 18}
              width={node.mbti.length * 7 + 10}
              height={16}
              rx={8}
              fill={node.color}
              opacity={0.15}
            />
            <text
              x={node.x}
              y={node.y + 29}
              textAnchor="middle"
              fill={node.color}
              fontSize={9}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={500}
            >
              {node.mbti}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
