'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '朝议', href: '/court', icon: '🏛️' },
  { label: '问策', href: '/consultation', icon: '📜', disabled: true },
  { label: '聚贤', href: '/gallery', icon: '👥', disabled: true },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-ink-400/8 bg-parchment-200/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/court" className="flex items-center gap-3 group">
          {/* TODO: 替换为实际 Logo 图片 — 将 logo 文件放入 apps/web/public/logo.png */}
          <Image
            src="/logo.png"
            alt="论衡"
            width={32}
            height={32}
            className="opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span className="font-serif text-2xl font-black text-ink-900 tracking-[6px] group-hover:text-gold-700 transition">
            论衡
          </span>
          <span className="hidden sm:inline font-serif text-xs text-ink-400/40 tracking-[2px] ml-2 leading-none border-l border-ink-400/15 pl-2">
            一问论衡 · 万智自明
          </span>
        </Link>

        {/* Nav Tabs */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const baseClass =
              'relative px-4 py-2 text-base font-serif tracking-wider transition rounded-md';
            const activeClass = 'text-gold-700 font-medium';
            const inactiveClass = 'text-ink-400/40 hover:text-ink-400/60';

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className={`${baseClass} text-ink-400/20 cursor-not-allowed select-none`}
                  title="即将开放"
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                  <span className="ml-1.5 text-[9px] font-mono text-gold-500/50 align-top">
                    SOON
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gold-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
