import { CSSProperties } from 'react';

type IconProps = {
  className?: string;
  style?: CSSProperties;
};

const base = (className?: string): CSSProperties => ({
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: 1,
  width: '1em',
  height: '1em',
  fontSize: className?.match(/w-(\S+)/)?.[1]?.replace('[', '').replace(']', '') ? undefined : undefined,
});

export function ArrowRight({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>→</span>;
}
export function ChevronRight({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>›</span>;
}
export function X({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>✕</span>;
}
export function Gift({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🎁</span>;
}
export function MessageCircle({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>💬</span>;
}
export function Link2({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🔗</span>;
}
export function Sparkles({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>✨</span>;
}
export function Check({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>✓</span>;
}
export function Clock({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>⏱</span>;
}
export function Share2({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>↗</span>;
}
export function Send({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>➤</span>;
}
export function Lock({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🔒</span>;
}
export function Ticket({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🎟</span>;
}
export function Compass({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🧭</span>;
}
export function Plus({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>+</span>;
}
export function ArrowLeft({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>←</span>;
}
export function Pencil({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>✎</span>;
}
export function Trash2({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>🗑</span>;
}
export function Download({ className, style }: IconProps) {
  return <span className={className} style={{ ...base(className), ...style }}>⬇</span>;
}
