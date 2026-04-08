import React, { useState } from 'react';
import { NavLink as RouterNavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useFinanceStore } from '../../store/financeStore';
import { 
  LayoutDashboard, Receipt, Users, Tags, Settings, 
  LogOut, Menu, X, ChevronRight, TrendingUp, CreditCard
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, setUser, reset } = useFinanceStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    reset();
    navigate('/login');
  };

  const sidebarWidth = '264px';

  const NavLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <RouterNavLink 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          textDecoration: 'none',
          color: isActive ? 'var(--brand-600)' : 'var(--slate-700)',
          background: isActive ? 'var(--brand-50)' : 'transparent',
          fontWeight: isActive ? 700 : 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: '0.25rem',
          border: isActive ? '1px solid var(--brand-100)' : '1px solid transparent',
        }}
      >
        <span style={{ color: isActive ? 'var(--brand-500)' : 'var(--slate-500)' }}>
          {icon}
        </span>
        <span style={{ fontSize: '0.9375rem' }}>{label}</span>
        {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
      </RouterNavLink>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      {/* Sidebar Desktop */}
      <aside className="glass" style={{
        width: sidebarWidth,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-light)',
        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 0.5rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <LayoutDashboard size={20} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Family<span style={{ color: 'var(--brand-600)' }}>Flow</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <div style={{ marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu Principal</div>
          <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavLink to="/transactions" icon={<Receipt size={20} />} label="Lançamentos" />
          <NavLink to="/investments" icon={<TrendingUp size={20} />} label="Investimentos" />
          <NavLink to="/cards" icon={<CreditCard size={20} />} label="Meus Cartões" />
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gestão</div>
          <NavLink to="/categories" icon={<Tags size={20} />} label="Categorias" />
          <NavLink to="/members" icon={<Users size={20} />} label="Família" />
          <NavLink to="/settings" icon={<Settings size={20} />} label="Configurações" />
        </nav>

        {/* User Profile / Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'var(--slate-100)', color: 'var(--brand-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem'
            }}>
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'transparent',
              color: 'var(--danger-500)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-50)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            <span>Sair do App</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minHeight: '100vh', transition: 'margin-left 0.4s', overflowY: 'auto' }}>
        {/* Mobile Header Toolbar */}
        <header className="mobile-header glass" style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 35,
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>FamilyFlow</h1>
          </div>
        </header>

        {/* Route Content Area */}
        <div style={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.5rem',
          paddingInline: 'clamp(1rem, 5vw, 3rem)',
          paddingBlock: 'clamp(1rem, 5vh, 2.5rem)',
        }}>
          <Outlet />
        </div>
      </main>

      {/* Overlay for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(4px)',
            zIndex: 30,
          }}
        />
      )}

      {/* Responsive Inline Styles */}
      <style>{`
        @media (min-width: 1024px) {
          aside { transform: translateX(0) !important; }
          main { margin-left: ${sidebarWidth} !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  );
};
