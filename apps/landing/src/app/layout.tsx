import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: '赛博圆桌 — 一个问题，万智共鸣',
  description:
    '溯千载智慧之流，解今朝现世之围。每日一场 AI 辩论，先哲跨时空对话，为你的困惑提供深度洞见。',
  openGraph: {
    title: '赛博圆桌 — Cyber Senate',
    description: '溯千载智慧之流，解今朝现世之围。每日一场 AI 辩论，先哲跨时空对话。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="bg-white text-neutral-900 font-body antialiased">{children}</body>
    </html>
  );
}
