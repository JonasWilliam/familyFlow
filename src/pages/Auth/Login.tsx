import { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { ApiService } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, User, ArrowRight, Sparkles, BarChart3, Shield, Zap } from 'lucide-react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useFinanceStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await ApiService.login(email, senha);
        setUser(data.user);
      } else {
        const data = await ApiService.register(nome, email, senha);
        setUser(data.user);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BarChart3, text: 'Dashboards em tempo real' },
    { icon: Shield, text: 'Dados seguros e privados' },
    { icon: Zap, text: 'Controle rápido e intuitivo' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
    }}>
      {/* Left Panel - Gradient Branding (proper 50%) */}
      <div style={{
        width: '50%',
        background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 40%, #a855f7 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 3.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative shapes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Large circle top-right */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-60px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }} />
          {/* Medium circle bottom-left */}
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '240px', height: '240px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
          }} />
          {/* Small circles scattered */}
          <div style={{
            position: 'absolute', top: '20%', right: '25%',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }} />
          <div style={{
            position: 'absolute', bottom: '30%', left: '15%',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
          }} />
          {/* Topographic line patterns */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', opacity: 0.06 }} viewBox="0 0 500 200" preserveAspectRatio="none">
            <path d="M0 100 Q125 50 250 100 T500 100" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 120 Q125 70 250 120 T500 120" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 140 Q125 90 250 140 T500 140" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 160 Q125 110 250 160 T500 160" fill="none" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.875rem',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '2.5rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <Sparkles size={13} />
            Controle financeiro inteligente
          </div>

          <h1 style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            marginBottom: '1rem',
            color: 'white',
          }}>
            FamilyFlow
          </h1>
          <p style={{
            fontSize: '1.0625rem',
            lineHeight: 1.7,
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            marginBottom: '2.5rem',
          }}>
            Entenda para onde seu dinheiro vai. Gerencie gastos familiares, organize
            categorias e tome decisões mais inteligentes.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} />
                  </div>
                  {feat.text}
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '2.5rem',
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            {[
              { value: '100%', label: 'Gratuito' },
              { value: 'Família', label: 'Multiusuário' },
              { value: 'Tempo real', label: 'Dashboards' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form (proper 50%) */}
      <div style={{
        width: '50%',
        background: 'linear-gradient(145deg, #f8faff 0%, #f0f0ff 50%, #f5f3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Decorative blurred shapes */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="animate-fade-in"
          style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: '0.375rem',
            }}>
              {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isLogin
                ? 'Entre na sua conta para continuar'
                : 'Comece a controlar suas finanças agora'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-50)',
              color: 'var(--danger-600)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <Input
                label="Nome completo"
                placeholder="Ex: João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                icon={<User size={16} />}
                required
              />
            )}
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button fullWidth type="submit" size="lg" loading={loading} style={{ marginTop: '0.5rem' }}>
              {isLogin ? 'Entrar' : 'Criar conta'}
              <ArrowRight size={16} />
            </Button>
          </form>

          <div style={{
            marginTop: '1.75rem',
            textAlign: 'center',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              {isLogin ? 'Não tem uma conta? ' : 'Já tem conta? '}
            </span>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-600)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {isLogin ? 'Cadastre-se gratuitamente' : 'Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
