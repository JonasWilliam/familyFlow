import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, style, ...props }: InputProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      <label
        style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          letterSpacing: '-0.006em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '0.6875rem 0.875rem 0.6875rem 2.625rem' : '0.6875rem 0.875rem',
            borderRadius: 'var(--radius-lg)',
            border: `1.5px solid ${error ? 'var(--danger-500)' : 'var(--border-light)'}`,
            backgroundColor: 'var(--bg-input)',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            color: 'var(--text-primary)',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--brand-500)';
            e.target.style.boxShadow = '0 0 0 3px var(--brand-100)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger-500)' : 'var(--border-light)';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger-500)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
};
