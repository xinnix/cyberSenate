'use client';

import { useRef, useState } from 'react';

interface ShareToolbarProps {
  cardId: string;
  fileName: string;
}

export function ShareToolbar({ cardId, fileName }: ShareToolbarProps) {
  const [toast, setToast] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 2500);
  };

  const capture = async (mode: 'square' | 'vertical' | 'full') => {
    const card = document.getElementById(cardId);
    if (!card) return;

    // 动态加载 html2canvas（避免 SSR 问题）
    const html2canvas = (await import('html2canvas')).default;

    const origOverflow = card.style.overflow;
    const origHeight = card.style.height;

    card.style.overflow = 'hidden';
    let cw = card.offsetWidth;
    let ch = card.offsetHeight;

    if (mode === 'square') {
      ch = cw;
      card.style.height = ch + 'px';
    } else if (mode === 'vertical') {
      ch = (cw * 4) / 3;
      card.style.height = ch + 'px';
    } else {
      card.style.height = 'auto';
      ch = card.getBoundingClientRect().height;
    }

    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#f5f0e6',
        useCORS: true,
        allowTaint: false,
        width: cw,
        height: ch,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('✅ 已保存至下载');
    } catch {
      showToast('❌ 截图失败，请重试');
    } finally {
      card.style.overflow = origOverflow;
      card.style.height = origHeight;
    }
  };

  return (
    <>
      <div className="flex gap-3 justify-center mb-6 flex-wrap">
        <button
          onClick={() => capture('square')}
          className="px-5 py-2.5 text-[13px] font-sans-cn font-medium border border-ink-400/10 rounded-md bg-parchment-100 text-ink-400 hover:bg-parchment-200 transition tracking-wider"
        >
          📱 朋友圈 1:1
        </button>
        <button
          onClick={() => capture('vertical')}
          className="px-5 py-2.5 text-[13px] font-sans-cn font-medium border border-ink-400/10 rounded-md bg-parchment-100 text-ink-400 hover:bg-parchment-200 transition tracking-wider"
        >
          📕 小红书 3:4
        </button>
        <button
          onClick={() => capture('full')}
          className="px-5 py-2.5 text-[13px] font-sans-cn font-medium border border-ink-400/10 rounded-md bg-parchment-100 text-ink-400 hover:bg-parchment-200 transition tracking-wider"
        >
          🖼️ 整页
        </button>
      </div>
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-ink-800 text-parchment-100 px-6 py-3 rounded-lg text-[13px] font-sans-cn z-50 shadow-lg animate-[fadeIn_0.3s_ease]">
          {toast}
        </div>
      )}
    </>
  );
}
