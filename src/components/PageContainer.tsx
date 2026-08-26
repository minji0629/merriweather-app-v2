import { ReactNode, CSSProperties } from 'react';
import { BusinessFooter } from '@/components/BusinessFooter';

export function PageContainer({ children, className = '', footer = true, style }: { children: ReactNode; className?: string; footer?: boolean; style?: CSSProperties }) {
  return (
    <div className={`relative w-full max-w-mobile mx-auto ${className}`} style={style}>
      <div className="relative min-h-screen flex flex-col">{children}</div>
      {footer && <BusinessFooter />}
    </div>
  );
}
