import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease-out',
        padding: isMobile ? '0' : '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '480px',
          maxHeight: isMobile ? '95vh' : '90vh',
          overflow: 'auto',
          background: '#ffffff',
          borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: isMobile ? 'slideUp 0.3s ease-out' : 'fadeInUp 0.2s ease-out',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          zIndex: 1,
          borderRadius: isMobile ? '20px 20px 0 0' : '0',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', color: 'var(--text-tertiary)',
              border: 'none', background: 'transparent',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--slate-100)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: isMobile ? '1rem 1.25rem 2rem' : '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

