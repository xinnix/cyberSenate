/** 角色配色调色板（按索引轮换） */
const PALETTE = [
  { bg: '#e4ecf0', text: '#2a6a8a' }, // 蓝
  { bg: '#f0e0e0', text: '#aa3a3a' }, // 红
  { bg: '#e4f0e8', text: '#3a7a4a' }, // 绿
  { bg: '#f0ece4', text: '#8a6a20' }, // 金
  { bg: '#ece4f0', text: '#6a3a8a' }, // 紫
  { bg: '#e4eff0', text: '#2a6a6a' }, // 青
  { bg: '#f0e8e4', text: '#8a4a20' }, // 橙
];

const DEFAULT = { bg: '#ede6d8', text: '#6a5528' };

/** 根据角色索引获取颜色（用于同一辩论内的角色区分） */
export function getCharacterColors(index: number) {
  return PALETTE[index % PALETTE.length] ?? DEFAULT;
}

/** 获取角色名首字母用于头像 */
export function getInitial(name: string): string {
  // 移除 emoji 前缀，取第一个有效字符
  const cleaned = name.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  return cleaned.charAt(0).toUpperCase() || name.charAt(0);
}
