import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-lg)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    width: fullWidth ? '100%' : undefined,
    ...getSizeStyles(size),
    ...getVariantStyles(variant),
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled || loading} {...props}>
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
};

function getSizeStyles(size: string): React.CSSProperties {
  switch (size) {
    case 'sm': return { padding: '0.4rem 0.875rem', fontSize: '0.8125rem' };
    case 'lg': return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
    default:   return { padding: '0.625rem 1.25rem', fontSize: '0.875rem' };
  }
}

function getVariantStyles(variant: string): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
        color: 'var(--text-on-brand)',
        boxShadow: 'var(--shadow-brand)',
      };
    case 'secondary':
      return {
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-xs)',
      };
    case 'danger':
      return {
        background: 'linear-gradient(135deg, var(--danger-500), var(--danger-600))',
        color: 'var(--text-on-brand)',
        boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.35)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--brand-600)',
      };
    default: return {};
  }
}

function LoadingSpinner() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="30" strokeDashoffset="10" opacity="0.6" />
    </svg>
  );
}
