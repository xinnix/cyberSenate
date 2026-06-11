'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';

const TopologyChart = dynamic(() => import('./TopologyChart'), { ssr: false });

/* ── 类型 ─────────────────────────────────────── */

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

interface SenateDecreeCardProps {
  conclusion: Conclusion;
  debateId?: string;
  issueNumber?: number;
}

/* ── 组件 ─────────────────────────────────────── */

export function SenateDecreeCard({ conclusion, debateId, issueNumber }: SenateDecreeCardProps) {
  // 构建 QR 码 URL：指向辩论详情页
  const qrUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    return debateId ? `${base}/court?debate=${debateId}` : base;
  }, [debateId]);

  // 从 goldenQuotes 中取前两条作为"群贤交锋"
  const clashQuotes = conclusion.goldenQuotes?.slice(0, 2) || [];

  return (
    <div className="mt-8 rounded-sm overflow-hidden" style={{ border: '1.5px solid #2a2824' }}>
      <div
        id="senate-decree-card"
        className="w-full max-w-[720px] mx-auto"
        style={{ backgroundColor: '#f5f0e6', padding: '4px' }}
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* ── 天命定调 (Header Hook) ── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              {issueNumber && (
                <span className="font-mono text-[11px] text-ink-400/50 tracking-wider">
                  ISSUE #{String(issueNumber).padStart(3, '0')}
                </span>
              )}
            </div>
            <span className="font-serif text-xs text-gold-700 tracking-[3px]">朝议法卷</span>
          </div>

          {/* ── 议题 ── */}
          <div className="text-center pb-4 border-b border-ink-400/10">
            <div className="font-mono text-[9px] text-ink-400/25 tracking-[4px] mb-2">
              ── 核心识见冲突 ──
            </div>
            <div className="font-serif text-lg font-bold text-ink-900 leading-relaxed tracking-[1px]">
              {conclusion.topic}
            </div>
          </div>

          {/* ── 思想拓扑 (2D Canvas) ── */}
          {conclusion.conflictTopology && (
            <div className="pb-4 border-b border-ink-400/10">
              <div className="text-center mb-3">
                <span className="font-mono text-[9px] text-ink-400/25 tracking-[4px]">
                  ── 思辨象限拓扑 ──
                </span>
              </div>
              <div className="overflow-x-auto">
                <TopologyChart topology={conclusion.conflictTopology} />
              </div>
            </div>
          )}

          {/* ── 群贤交锋 (Climax Clashes) ── */}
          {clashQuotes.length > 0 && (
            <div className="space-y-3 pb-4 border-b border-ink-400/10">
              <div className="text-center">
                <span className="font-mono text-[9px] text-ink-400/25 tracking-[4px]">
                  ── 群贤交锋 ──
                </span>
              </div>
              {clashQuotes.map((q, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-sm"
                  style={{
                    borderLeft: `2px solid ${i === 0 ? '#b8963a' : '#8a3c3c'}`,
                    backgroundColor: 'rgba(0,0,0,0.02)',
                  }}
                >
                  <p className="font-serif text-sm text-ink-800 italic leading-relaxed">
                    &ldquo;{q}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── 最终法案 (The Decree Judgment) ── */}
          {conclusion.decisionModel && (
            <div className="pb-4 border-b border-ink-400/10">
              <div className="text-center mb-3">
                <span className="font-mono text-[9px] text-ink-400/25 tracking-[4px]">
                  ── 终极判词 ──
                </span>
              </div>
              <div className="px-4 py-3 rounded-sm bg-ink-900/[0.03] border border-ink-400/8">
                <p className="font-serif text-sm text-ink-800 leading-relaxed">
                  {conclusion.decisionModel}
                </p>
              </div>
            </div>
          )}

          {/* ── 执槌入口 (Growth Loop Footer) ── */}
          <div className="flex items-center justify-between pt-2">
            {/* QR 码 */}
            <div className="p-2 rounded-sm" style={{ backgroundColor: '#f5f0e6' }}>
              {qrUrl && (
                <QRCodeSVG value={qrUrl} size={72} bgColor="#f5f0e6" fgColor="#2a2824" level="M" />
              )}
            </div>

            {/* 裂变文案 */}
            <div className="text-right pr-2">
              <p className="font-serif text-xs text-ink-400/40 tracking-[2px] leading-relaxed">
                🏛️ 抽身尘嚣三分钟
              </p>
              <p className="font-serif text-xs text-gold-700 tracking-[2px] leading-relaxed mt-0.5">
                入座千载思想局
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
