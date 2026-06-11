'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with SVG
const TopologyChart = dynamic(() => import('./TopologyChart'), { ssr: false });

interface ConflictTopology {
  quadrants: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  nodes: {
    id: string;
    name: string;
    mbti: string;
    weapon: string;
    thesis: string;
    color: string;
    x: number;
    y: number;
  }[];
  edges: {
    source: string;
    target: string;
    type: 'clash' | 'exploit' | 'deconstruct';
    label: string;
  }[];
}

interface Conclusion {
  topic: string;
  characterSignatures: string[];
  coreConflict: string;
  goldenQuotes: string[];
  decisionModel: string;
  conflictTopology?: ConflictTopology;
}

interface ConclusionCardProps {
  conclusion: Conclusion;
}

export function ConclusionCard({ conclusion }: ConclusionCardProps) {
  return (
    <div className="mt-8 p-6 rounded-lg border-2 border-gold-500/30 bg-gradient-to-br from-gold-500/5 to-parchment-100">
      <h3 className="text-center text-lg font-serif font-bold text-gold-700 mb-5">📜 结案锦囊</h3>
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase">议题</p>
          <p className="mt-1 text-ink-900 font-serif">{conclusion.topic}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase">参与先哲</p>
          <p className="mt-1 text-ink-900">{conclusion.characterSignatures?.join(' · ')}</p>
        </div>
        {conclusion.coreConflict && (
          <div>
            <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase">
              核心冲突
            </p>
            <p className="mt-1 text-ink-900 font-serif">{conclusion.coreConflict}</p>
          </div>
        )}

        {/* 二维思辨象限拓扑 */}
        {conclusion.conflictTopology && (
          <div>
            <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase mb-2">
              思辨象限
            </p>
            <div className="overflow-x-auto">
              <TopologyChart topology={conclusion.conflictTopology} />
            </div>
          </div>
        )}

        {conclusion.goldenQuotes?.length > 0 && (
          <div>
            <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase">
              先哲金句
            </p>
            <ul className="mt-2 space-y-2">
              {conclusion.goldenQuotes.map((q, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-parchment-100/80 p-3 text-ink-800 italic font-serif"
                >
                  &ldquo;{q}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}
        {conclusion.decisionModel && (
          <div>
            <p className="text-[10px] font-mono text-gold-500 tracking-widest uppercase">
              决策建议
            </p>
            <p className="mt-1 text-ink-900">{conclusion.decisionModel}</p>
          </div>
        )}
      </div>
      <div className="mt-5 pt-3 border-t border-gold-500/20 text-center text-[10px] text-ink-400/30 tracking-widest">
        本次论道已载入史册，先哲已退席
      </div>
    </div>
  );
}
