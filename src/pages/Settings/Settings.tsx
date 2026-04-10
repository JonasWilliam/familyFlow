import { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Calendar, Save, CheckCircle2, Wallet, Receipt, TrendingUp, CreditCard, Tags, Users, ShieldCheck } from 'lucide-react';

export const Settings = () => {
    const { user, settings, updateStartDay, updateFamilyPermissions, updateProfile } = useFinanceStore();
    const [startDay, setStartDay] = useState(settings.startDay || '10');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Permission state
    const currentBlocked = user?.family?.blockedMenus ? user.family.blockedMenus.split(',') : [];
    const [blockedList, setBlockedList] = useState<string[]>(currentBlocked);
    const [savingPermissions, setSavingPermissions] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSuccess(false);
      try {
        await updateStartDay(startDay);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    };

    const toggleMenu = (key: string) => {
      setBlockedList(prev => 
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    };

    const handleSavePermissions = async () => {
      setSavingPermissions(true);
      try {
        await updateFamilyPermissions(blockedList.join(','));
        alert('Permissões da família atualizadas!');
      } catch (err) {
        alert('Erro ao salvar permissões');
      } finally {
        setSavingPermissions(false);
      }
    };

    const MENU_OPTIONS = [
      { key: 'transactions', label: 'Lançamentos', icon: <Receipt size={16} /> },
      { key: 'investments', label: 'Investimentos', icon: <TrendingUp size={16} /> },
      { key: 'cards', label: 'Meus Cartões', icon: <CreditCard size={16} /> },
      { key: 'categories', label: 'Categorias', icon: <Tags size={16} /> },
      { key: 'members', label: 'Membros da Família', icon: <Users size={16} /> },
    ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Configurações</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Personalize como o FamilyFlow funciona para a sua realidade.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
        {/* CONFIGURAÇÃO DE SALDO INICIAL */}
        <Card className="glass" padding="2rem">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: '12px' }}>
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="h2">Ajuste de Saldo</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Defina seu saldo inicial caso já possua dinheiro em conta.</p>
            </div>
          </div>

          <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Saldo Inicial em Conta</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-tertiary)' }}>R$</span>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={user?.initialBalance || 0}
                  onChange={(e) => updateProfile({ initialBalance: parseFloat(e.target.value) || 0 })}
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', 
                    border: '1.5px solid var(--border-light)', outline: 'none', fontWeight: 800, fontSize: '1rem',
                    color: 'var(--brand-900)'
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              * Note: Este valor será o ponto de partida para o cálculo do seu 'Dinheiro em Caixa'.
            </p>
          </div>
        </Card>

        {/* General Settings */}
        <Card padding="2rem" className="glass">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--brand-500)' }} />
                <h3 className="h3">Ciclo Financeiro</h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
                Defina em qual dia o seu mês financeiro começa.
              </p>
              
              <Input 
                label="Dia de Início do Mês" 
                type="number" 
                min="1" 
                max="31" 
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
                placeholder="Ex: 10"
                required
              />
            </div>

            <Button type="submit" loading={saving} fullWidth>
              <Save size={18} /> Salvar Configurações
            </Button>

            {success && (
              <div style={{ color: 'var(--success-600)', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center' }}>
                <CheckCircle2 size={16} /> Salvo com sucesso!
              </div>
            )}
          </form>
        </Card>

        {/* Family Permissions (Only for HEAD) */}
        {user?.role === 'HEAD' && (
          <Card padding="2rem" className="glass" style={{ border: '1px solid var(--brand-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--brand-600)' }} />
              <h3 className="h3">Controle de Acesso da Família</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Como <strong>Chefe da Família</strong>, você pode restringir quais menus outros membros podem acessar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MENU_OPTIONS.map(opt => {
                const isBlocked = blockedList.includes(opt.key);
                return (
                  <div key={opt.key} 
                    onClick={() => toggleMenu(opt.key)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '1rem', borderRadius: 'var(--radius-lg)', 
                      background: isBlocked ? 'var(--slate-50)' : 'white',
                      border: `1.5px solid ${isBlocked ? 'var(--slate-200)' : 'var(--border-light)'}`,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: isBlocked ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                      {opt.icon}
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{opt.label}</span>
                    </div>
                    <div style={{ 
                      width: '40px', height: '20px', borderRadius: '20px', 
                      background: isBlocked ? 'var(--danger-500)' : 'var(--success-500)',
                      position: 'relative', transition: 'all 0.3s'
                    }}>
                      <div style={{ 
                        width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '3px', left: isBlocked ? '23px' : '3px',
                        transition: 'all 0.3s'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button fullWidth style={{ marginTop: '1.5rem' }} onClick={handleSavePermissions} loading={savingPermissions}>
              Aplicar Restrições
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
