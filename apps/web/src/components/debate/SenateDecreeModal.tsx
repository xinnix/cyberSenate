'use client';

import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ── 类型 ─────────────────────────────────────── */

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

interface ConflictTopology {
  quadrants: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
  nodes: TopologyNode[];
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

interface Props {
  conclusion: Conclusion;
  debateId?: string;
  issueNumber?: number;
  onClose: () => void;
}

/* ── 组件 ─────────────────────────────────────── */

export function SenateDecreeModal({ conclusion, debateId, issueNumber, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState('');

  const qrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/court${debateId ? `?debate=${debateId}` : ''}`
      : '';

  const clashQuotes = conclusion.goldenQuotes || [];
  const personaNodes = conclusion.conflictTopology?.nodes || [];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const capture = async (mode: 'square' | 'vertical' | 'full') => {
    const el = cardRef.current;
    if (!el) return showToast('❌ 未找到法卷');

    const html2canvas = (await import('html2canvas')).default;

    // 临时解除外层 overflow 让截图完整
    const scrollWrap = el.closest('.overflow-y-auto') as HTMLElement | null;
    const origWrapOverflow = scrollWrap?.style?.overflowY ?? '';
    const origElOverflow = el.style.overflow;
    const origElHeight = el.style.height;

    if (scrollWrap) scrollWrap.style.overflowY = 'visible';
    el.style.overflow = 'visible';
    el.style.height = 'auto';

    const cw = el.scrollWidth || 720;
    let ch = el.scrollHeight;

    if (mode === 'square') {
      ch = cw;
    } else if (mode === 'vertical') {
      ch = Math.round((cw * 4) / 3);
    }

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#f5f0e6',
        useCORS: true,
        width: cw,
        height: ch,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `朝议法卷-${conclusion.topic.slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('✅ 已保存至下载');
    } catch {
      showToast('❌ 截图失败，请重试');
    } finally {
      el.style.overflow = origElOverflow;
      el.style.height = origElHeight;
      if (scrollWrap) scrollWrap.style.overflowY = origWrapOverflow;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" />

      <div className="relative z-10 max-h-[90vh] w-full max-w-[740px] flex flex-col">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => capture('square')}
              className="px-4 py-2 text-[12px] font-serif tracking-wider rounded-md bg-parchment-100/90 text-ink-400 hover:bg-parchment-200 transition backdrop-blur-sm"
            >
              📱 朋友圈 1:1
            </button>
            <button
              onClick={() => capture('vertical')}
              className="px-4 py-2 text-[12px] font-serif tracking-wider rounded-md bg-parchment-100/90 text-ink-400 hover:bg-parchment-200 transition backdrop-blur-sm"
            >
              📕 小红书 3:4
            </button>
            <button
              onClick={() => capture('full')}
              className="px-4 py-2 text-[12px] font-serif tracking-wider rounded-md bg-parchment-100/90 text-ink-400 hover:bg-parchment-200 transition backdrop-blur-sm"
            >
              🖼️ 整页
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-parchment-100/90 text-ink-400/50 hover:text-ink-400 hover:bg-parchment-200 transition backdrop-blur-sm text-lg"
          >
            ✕
          </button>
        </div>

        {/* 卡片主体（可滚动，截图时克隆一份不约束的） */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-fade">
          <div
            ref={cardRef}
            id="senate-decree-card"
            className="mx-auto w-full"
            style={{ maxWidth: '720px', backgroundColor: '#f5f0e6', border: '1.5px solid #2a2824' }}
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* ── 天命定调 ── */}
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

              {/* ── 核心识见冲突 ── */}
              <div className="text-center pb-4 border-b border-ink-400/10">
                <div className="font-mono text-[9px] text-ink-400/25 tracking-[4px] mb-2">
                  ── 核心识见冲突 ──
                </div>
                <div className="font-serif text-lg font-bold text-ink-900 leading-relaxed tracking-[1px]">
                  {conclusion.topic}
                </div>
              </div>

              {/* ── 群贤交锋（含角色卡） ── */}
              {personaNodes.length > 0 && (
                <div className="pb-4 border-b border-ink-400/10">
                  <div className="text-center mb-4">
                    <span className="font-mono text-[9px] text-ink-400/25 tracking-[4px]">
                      ── 群贤交锋 ──
                    </span>
                  </div>
                  <div className="space-y-3">
                    {personaNodes.map((persona, i) => {
                      const quote = clashQuotes[i] || '';
                      return (
                        <div
                          key={persona.id}
                          className="p-4 rounded-sm"
                          style={{ backgroundColor: `${persona.color}06` }}
                        >
                          {/* 辩手名 */}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-sm font-bold font-serif"
                              style={{ color: persona.color }}
                            >
                              {persona.name.replace(/[🏛🧓🦾🎩🤯🧘📐]/gu, '').trim()}
                            </span>
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                              style={{
                                color: persona.color,
                                backgroundColor: `${persona.color}12`,
                              }}
                            >
                              {persona.mbti}
                            </span>
                          </div>

                          {/* 金句 */}
                          {quote && (
                            <div
                              className="px-4 py-3 rounded-sm"
                              style={{
                                borderLeft: `2px solid ${persona.color}`,
                                backgroundColor: `${persona.color}04`,
                              }}
                            >
                              <p className="font-serif text-sm text-ink-800 leading-relaxed">
                                &ldquo;{quote}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── 思想拓扑 ──（暂隐藏） */}
              {/* {conclusion.conflictTopology && (
              <div className="pb-4 border-b border-ink-400/10">
                <div className="text-center mb-3">
                  <span className="font-mono text-[9px] text-ink-400/25 tracking-[4px]">── 思想拓扑 ──</span>
                </div>
                <div className="overflow-x-auto">
                  <TopologyChart topology={conclusion.conflictTopology} />
                </div>
              </div>
            )} */}

              {/* ── 终极判词 ── */}
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

              {/* ── 执槌入口 ── */}
              <div className="flex items-center justify-between pt-2">
                <div className="p-2 rounded-sm" style={{ backgroundColor: '#f5f0e6' }}>
                  {qrUrl && (
                    <QRCodeSVG
                      value={qrUrl}
                      size={72}
                      bgColor="#f5f0e6"
                      fgColor="#2a2824"
                      level="M"
                    />
                  )}
                </div>
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
      </div>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-ink-800 text-parchment-100 px-6 py-3 rounded-lg text-[13px] font-serif z-[60] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
