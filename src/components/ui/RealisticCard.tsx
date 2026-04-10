

import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface RealisticCardProps {
  banco: string;
  last4: string;
  nome?: string;
  limite?: number;
  vencimento?: string | number;
}

const bankColors: Record<string, { bg: string, text: string }> = {
  'Nubank': { bg: 'linear-gradient(135deg, #8A05BE 0%, #530082 100%)', text: '#ffffff' },
  'Inter': { bg: 'linear-gradient(135deg, #FF7A00 0%, #E65C00 100%)', text: '#ffffff' },
  'Hipercard': { bg: 'linear-gradient(135deg, #B60000 0%, #8B0000 100%)', text: '#ffffff' },
  'Itau': { bg: 'linear-gradient(135deg, #EC7000 0%, #003399 100%)', text: '#ffffff' },
  'Santander': { bg: 'linear-gradient(135deg, #EC0000 0%, #B30000 100%)', text: '#ffffff' },
  'Banco do Brasil': { bg: 'linear-gradient(135deg, #FCF000 0%, #D4C900 100%)', text: '#003399' },
  'Bradesco': { bg: 'linear-gradient(135deg, #CC092F 0%, #8B0620 100%)', text: '#ffffff' },
  'Outros': { bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: '#ffffff' },
};

export const RealisticCard: React.FC<RealisticCardProps> = ({ banco, last4, nome, vencimento }) => {
  const styles = bankColors[banco] || bankColors['Outros'];
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Subtract padding (approx 48px for layout)
      const availableWidth = Math.min(width - 48, 350);
      if (availableWidth < 350) {
        setScale(availableWidth / 350);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      width: '350px',
      height: '200px',
      borderRadius: '20px',
      background: styles.bg,
      padding: '1.5rem',
      color: styles.text,
      position: 'relative',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      cursor: 'default',
      userSelect: 'none',
      margin: scale < 1 ? `0 0 ${-200 * (1 - scale)}px 0` : '0', // Adjust margin to avoid gap after scaling
    }} className="card-hover">
      
      {/* Glossy Overlay */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 100%)',
        transform: 'rotate(-25deg)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}>{banco}</span>
        <Wifi size={24} style={{ opacity: 0.8 }} />
      </div>

      <div style={{ zIndex: 1, marginTop: '1rem' }}>
        {/* Chip */}
        <div style={{
          width: '45px',
          height: '35px',
          background: 'linear-gradient(135deg, #f3d056 0%, #dbb126 100%)',
          borderRadius: '6px',
          position: 'relative',
          marginBottom: '1rem',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
        }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.1)' }} />
        </div>

        <div style={{ 
          fontSize: '1.25rem', 
          fontFamily: "'Courier New', Courier, monospace", 
          display: 'flex', 
          gap: '12px',
          letterSpacing: '2px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          <span>****</span>
          <span>****</span>
          <span>****</span>
          <span style={{ fontWeight: 700 }}>{last4 || '0000'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
        <div>
          <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>Titular</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>{nome || 'FULANO DE TAL'}</p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          {vencimento && (
            <>
              <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>Expira</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>12/29</p>
            </>
          )}
        </div>
      </div>

      {/* Mastercard/Visa Stylized circles far right */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        gap: '-10px'
      }}>
        <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', zIndex: 2 }} />
        <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginLeft: '-15px', zIndex: 1 }} />
      </div>
    </div>
  );
};
