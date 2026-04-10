import { useEffect, useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  TrendingUp, Plus, Pencil, Trash2, 
  Wallet, PieChart, BarChart3, Bitcoin, 
  ShieldCheck, Coins, Target
} from 'lucide-react';
import type { InvestmentType } from '../../models/PatrimonioModels';
import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '../../utils/formatters';

const typeConfig: Record<InvestmentType, { label: string, icon: any, color: string, bg: string }> = {
  poupança: { label: 'Poupança', icon: Wallet, color: 'var(--brand-600)', bg: 'var(--brand-50)' },
  bolsa: { label: 'Bolsa de Valores', icon: PieChart, color: 'var(--success-600)', bg: 'var(--success-50)' },
  renda_fixa: { label: 'Renda Fixa / CDI', icon: BarChart3, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
  cripto: { label: 'Criptoativos', icon: Bitcoin, color: 'var(--danger-600)', bg: 'var(--danger-50)' },
  previdencia: { label: 'Previdência', icon: ShieldCheck, color: 'var(--info-600)', bg: 'var(--info-50)' },
};


export const InvestmentsManagement = () => {
  const { investments, loadInvestments, addInvestment, updateInvestment, deleteInvestment } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Estados de Formulário
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<InvestmentType>('poupança');
  const [meta, setMeta] = useState('');

  // Estados de Deleção
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadInvestments(); }, [loadInvestments]);

  const totalPatrimonio = useMemo(() => 
    investments.reduce((sum, inv) => sum + inv.valor, 0)
  , [investments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = { 
      descricao, 
      valor: parseCurrencyBRL(valor), 
      tipo,
      meta: meta ? parseCurrencyBRL(meta) : undefined
    };

    try {
      if (editingId) {
        await updateInvestment(editingId, payload);
      } else {
        await addInvestment(payload);
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const openEdit = (inv: typeof investments[0]) => {
    setEditingId(inv.id);
    setDescricao(inv.descricao);
    setValor(formatCurrencyBRL(inv.valor));
    setTipo(inv.tipo);
    setMeta(inv.meta ? formatCurrencyBRL(inv.meta) : '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDescricao('');
    setValor('');
    setTipo('poupança');
    setMeta('');
    setEditingId(null);
    setError('');
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteInvestment(deleteTargetId);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER SECTION - EXACT CLONE OF TRANSACTIONS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Investimentos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 700 }}>
            {investments.length} ativos cadastrados • Patrimônio Total: R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Novo Investimento
        </Button>
      </div>

      {/* SUMMARY BAR - SOLID BACKGROUND */}
      <Card hover={false} padding="1.25rem" style={{ 
        background: '#ffffff',
        border: '1.5px solid var(--brand-100)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'var(--brand-500)', color: 'white', width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-brand)' }}>
            <Wallet size={26} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.15rem' }}>Balanço Global de Ativos</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--brand-950)', letterSpacing: '-0.03em' }}>
              R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </Card>

      {investments.length === 0 ? (
        <Card padding="5rem 2rem" style={{ textAlign: 'center', background: '#ffffff' }}>
          <Coins size={64} style={{ color: 'var(--brand-100)', marginBottom: '1.5rem' }} />
          <h3 className="h3">Fundo Vazio</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '300px', margin: '0.5rem auto' }}>
            Sua jornada de investimentos começa aqui. Adicione seu primeiro título.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {investments.map((inv, i) => {
            const config = typeConfig[inv.tipo];
            const Icon = config.icon;
            const progress = inv.meta ? Math.min((inv.valor / inv.meta) * 100, 100) : 0;
            
            return (
              <Card 
                key={inv.id} 
                className={`animate-fade-in-delay-${Math.min(i + 1, 3)}`} 
                padding="1.5rem"
                style={{ 
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      background: config.bg, color: config.color, 
                      width: '48px', height: '48px', borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${config.color}20`
                    }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 900, color: config.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{config.label}</p>
                      <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{inv.descricao}</h4>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEdit(inv)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--slate-50)', color: 'var(--slate-600)', border: '1px solid var(--slate-100)' }}><Pencil size={14} /></button>
                    <button onClick={() => confirmDelete(inv.id)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--danger-50)', color: 'var(--danger-600)', border: '1px solid var(--danger-100)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <div style={{ padding: '0 0.25rem' }}>
                  <p style={{ fontWeight: 950, fontSize: '1.75rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                    R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>

                  {inv.meta && (
                    <div style={{ marginTop: '1.75rem', padding: '1rem', background: 'var(--slate-50)', borderRadius: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Target size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Objetivo</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 950, color: config.color }}>{progress.toFixed(1)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          background: config.color,
                          borderRadius: '10px',
                          boxShadow: `0 0 10px ${config.color}40`,
                          transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.625rem' }}>
                         <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 800 }}>R$ {inv.valor.toLocaleString('pt-BR')}</span>
                         <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 800 }}>Meta: R$ {inv.meta.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL - SOLID HIGH CONTRAST */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar Investimento' : 'Novo Investimento'}>
        {error && <div style={{ padding: '1rem', background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--danger-100)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', fontSize: '0.8125rem', fontWeight: 700 }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04rem', display: 'block', marginBottom: '0.75rem' }}>Tipo de Ativo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.625rem' }}>
              {(Object.keys(typeConfig) as InvestmentType[]).map((key) => {
                const cfg = typeConfig[key];
                const Icon = cfg.icon;
                const isSelected = tipo === key;
                return (
                  <button 
                    key={key}
                    type="button"
                    onClick={() => setTipo(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 0.5rem',
                      borderRadius: '14px',
                      border: `2px solid ${isSelected ? cfg.color : 'var(--border-light)'}`,
                      background: isSelected ? cfg.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: isSelected ? cfg.color : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900 }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Qual o nome do investimento?" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Tesouro Selic 2026..." icon={<BarChart3 size={18} />} required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Input label="Valor Atual" type="text" inputMode="numeric" value={valor} onChange={(e) => setValor(maskCurrency(e.target.value))} placeholder="0,00" icon={<Coins size={18} />} required />
            <Input label="Meta Alvo" type="text" inputMode="numeric" value={meta} onChange={(e) => setMeta(maskCurrency(e.target.value))} placeholder="Opcional" icon={<Target size={18} />} />
          </div>

          <Button fullWidth type="submit" style={{ height: '56px', marginTop: '0.75rem', fontSize: '1.0625rem', fontWeight: 900 }}>
            {editingId ? 'Salvar Mudanças' : 'Cadastrar Ativo'}
          </Button>
        </form>
      </Modal>

      {/* MODAL DELETAR - ALTO CONTRASTE */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Confirmar Remoção">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '2px solid var(--danger-100)' }}> <Trash2 size={36} /> </div>
          <div> 
            <h3 style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--text-primary)' }}>Remover este ativo?</h3> 
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.75rem', fontWeight: 600, lineHeight: 1.6 }}>Esta ação é irreversível e removerá o saldo do seu patrimônio global.</p> 
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button fullWidth variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting} style={{ height: '52px' }}>Cancelar</Button>
            <Button fullWidth onClick={handleDelete} loading={deleting} style={{ background: 'var(--danger-600)', height: '52px' }}>Sim, Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
