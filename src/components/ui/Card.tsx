interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}

export const Card = ({ 
  children, 
  className = '', 
  padding = '1.5rem', 
  hover = true,
  style,
}: CardProps) => {
  const cardStyle: React.CSSProperties = {
    background: style?.background ?? (className.includes('glass') ? 'transparent' : 'var(--bg-card)'),
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    padding,
    transition: hover 
      ? 'all var(--transition-base)' 
      : undefined,
    overflow: 'hidden',
    position: 'relative',
    ...style,
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      } : undefined}
    >
      {children}
    </div>
  );
};
