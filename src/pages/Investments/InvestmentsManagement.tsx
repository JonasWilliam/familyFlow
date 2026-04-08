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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--border-light)',
    backgroundColor: 'white',
    fontSize: '0.9375rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Investimentos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Gerencie seu patrimônio e ativos financeiros</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Novo Investimento
        </Button>
      </div>

      <Card className="glass" padding="1.5rem" style={{ 
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', 
        color: 'white',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-xl)' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: 600 }}>Patrimônio Total Investido</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </Card>

      {investments.length === 0 ? (
        <Card className="glass animate-fade-in-delay-1" padding="4rem 2rem" style={{ textAlign: 'center' }}>
          <Coins size={48} style={{ color: 'var(--brand-200)', marginBottom: '1rem' }} />
          <h3 className="h3">Comece a investir!</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Adicione seus ativos para acompanhar a evolução do seu patrimônio.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {investments.map((inv, i) => {
            const config = typeConfig[inv.tipo];
            const Icon = config.icon;
            const progress = inv.meta ? Math.min((inv.valor / inv.meta) * 100, 100) : 0;
            
            return (
              <Card key={inv.id} className={`glass animate-fade-in-delay-${Math.min(i + 1, 3)}`} padding="1.5rem">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ background: config.bg, color: config.color, padding: '0.625rem', borderRadius: 'var(--radius-lg)' }}>
                    <Icon size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(inv)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none' }}><Pencil size={16} /></button>
                    <button onClick={() => confirmDelete(inv.id)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: config.color, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{config.label}</p>
                  <h4 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{inv.descricao}</h4>
                  <p style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

                  {inv.meta && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Progresso da Meta</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: config.color }}>{progress.toFixed(1)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--slate-100)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          background: config.color,
                          borderRadius: '10px',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                        Meta: R$ {inv.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar Investimento' : 'Novo Investimento'}>
        {error && <div style={{ padding: '0.875rem', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tipo de Ativo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as InvestmentType)} style={selectStyle}>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: CDB Banco ABC" icon={<BarChart3 size={18} />} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input 
              label="Valor Atual (R$)" 
              type="text" 
              inputMode="numeric"
              value={valor} 
              onChange={(e) => setValor(maskCurrency(e.target.value))} 
              placeholder="0,00" 
              icon={<Coins size={18} />} 
              required 
            />
            <Input 
              label="Meta Alvo (R$)" 
              type="text" 
              inputMode="numeric"
              value={meta} 
              onChange={(e) => setMeta(maskCurrency(e.target.value))} 
              placeholder="Opcional" 
              icon={<Target size={18} />} 
            />
          </div>
          <Button fullWidth type="submit" style={{ height: '48px', marginTop: '0.5rem' }}>
            {editingId ? 'Salvar Alterações' : 'Adicionar Ativo'}
          </Button>
        </form>
      </Modal>

      {/* Modal Deletar */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Remover Ativo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}> <Trash2 size={28} /> </div>
          <div> <h3 className="h3">Remover investimento?</h3> <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Esta ação removerá permanentemente o ativo do seu patrimônio.</p> </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button fullWidth variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancelar</Button>
            <Button fullWidth onClick={handleDelete} loading={deleting} style={{ background: 'var(--danger-500)' }}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
