'use client';

import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * 轻量 Markdown 渲染器
 * 将 LLM 输出中的 markdown 标记渲染为带样式的 React 元素
 *
 * 支持：**加粗**、*斜体*、`行内代码`、### 标题、列表、引用
 * 不支持的标记原样显示（降级优雅）
 */
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // 匹配 **加粗**、*斜体*、`代码` —— 按位置先后处理
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // match 前的普通文本
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **加粗**
      nodes.push(
        <strong key={key++} className="font-bold text-ink-900">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // *斜体*
      nodes.push(
        <em key={key++} className="italic">
          {match[4]}
        </em>,
      );
    } else if (match[5]) {
      // `代码`
      nodes.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-ink-100/50 text-ink-700 text-[13px] font-mono"
        >
          {match[6]}
        </code>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  // 剩余文本
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * 渲染 markdown 文本为带样式的 React 节点
 * 按行处理，支持标题、列表、引用、分割线等块级元素
 */
export function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-1">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行
    if (!trimmed) {
      flushList();
      continue;
    }

    // 分割线
    if (/^_{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^---+$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={key++} className="my-3 border-ink-200/30" />);
      continue;
    }

    // 标题 ### 或 ##
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushList();
      elements.push(
        <p key={key++} className="font-serif font-bold text-ink-900 mt-2 mb-1">
          {parseInline(headingMatch[1])}
        </p>,
      );
      continue;
    }

    // 引用 >
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-gold-500/40 pl-3 my-1 text-ink-700/80 italic"
        >
          {parseInline(quoteText)}
        </blockquote>,
      );
      continue;
    }

    // 无序列表 [- * +]
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)/);
    if (ulMatch) {
      listItems.push(
        <li key={listItems.length} className="text-ink-800">
          {parseInline(ulMatch[1])}
        </li>,
      );
      continue;
    }

    // 有序列表 1. 2. 3.
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      listItems.push(
        <li key={listItems.length} className="text-ink-800 list-decimal">
          {parseInline(olMatch[1])}
        </li>,
      );
      continue;
    }

    // 代码块开始/结束 — 跳过（简化处理）
    if (trimmed.startsWith('```')) {
      flushList();
      continue;
    }

    // 普通段落
    flushList();
    elements.push(
      <span key={key++} className="inline">
        {i > 0 ? ' ' : ''}
        {parseInline(trimmed)}
      </span>,
    );
  }

  flushList();

  return <div className={`leading-[1.8] tracking-wide font-serif ${className}`}>{elements}</div>;
}
