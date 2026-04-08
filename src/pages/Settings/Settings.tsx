import { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Calendar, Save, CheckCircle2, Info } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSetting } = useFinanceStore();
  const [startDay, setStartDay] = useState(settings.startDay || '10');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSetting('startDay', startDay);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Configurações</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Personalize como o FamilyFlow funciona para a sua realidade.
        </p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <Card padding="2rem" className="glass">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--brand-500)' }} />
                <h3 className="h3">Ciclo Financeiro</h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
                Defina em qual dia o seu mês financeiro começa. Isso afetará os totais do seu Dashboard e filtros automáticos.
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

            <div className="glass" style={{ 
              padding: '1rem', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--brand-50)',
              border: '1px solid var(--brand-100)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <Info size={16} style={{ color: 'var(--brand-600)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--brand-800)', lineHeight: 1.5 }}>
                <strong>Como funciona:</strong> Se você definir dia <strong>{startDay || '10'}</strong>, seu período atual será de <strong>{startDay || '10'}/{new Date().getMonth() + 1}</strong> até <strong>{Number(startDay || '10') - 1}/{new Date().getMonth() + 2}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Button type="submit" loading={saving} fullWidth>
                <Save size={18} /> Salvar Configurações
              </Button>
            </div>

            {success && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                justifyContent: 'center',
                color: 'var(--success-600)',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem',
                background: 'var(--success-50)',
                borderRadius: 'var(--radius-md)',
              }}>
                <CheckCircle2 size={16} /> Configuração salva com sucesso!
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};
