import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { RealisticCard } from '../../components/ui/RealisticCard';
import { 
  Plus, Pencil, Trash2, 
  Settings, Zap,
  Calendar, CreditCard as CardIcon,
  ShieldCheck
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '../../utils/formatters';

const BANCOS_DISPONIVEIS = [
  'Nubank', 'Inter', 'Itau', 'Santander', 'Bradesco', 'Banco do Brasil', 'Hipercard', 'Outros'
];

export const CardsManagement = () => {
  const { cards, loadCards, addCard, updateCard, deleteCard } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  // Form states
  const [nome, setNome] = useState('');
  const [limite, setLimite] = useState('');
  const [fechamento, setFechamento] = useState('10');
  const [vencimento, setVencimento] = useState('15');
  const [banco, setBanco] = useState('Nubank');
  const [last4, setLast4] = useState('');

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const resetForm = () => {
    setNome('');
    setLimite('');
    setFechamento('10');
    setVencimento('15');
    setBanco('Nubank');
    setLast4('');
    setEditingId(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (card: any) => {
    setEditingId(card.id);
    setNome(card.nome);
    setLimite(formatCurrencyBRL(card.limite));
    setFechamento(String(card.fechamento));
    setVencimento(String(card.vencimento));
    setBanco(card.banco || 'Nubank');
    setLast4(card.last4 || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = { 
      nome, 
      limite: parseCurrencyBRL(limite), 
      fechamento: Number(fechamento), 
      vencimento: Number(vencimento),
      banco,
      last4: last4.slice(-4)
    };

    try {
      if (editingId) {
        await updateCard(editingId, payload);
      } else {
        await addCard(payload);
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cartão');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cartão?')) {
      await deleteCard(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER SECTION - EXACT CLONE OF TRANSACTIONS */}
      {/* HEADER SECTION */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: isMobile ? 'nowrap' : 'wrap', 
        gap: '0.75rem',
        width: '100%' 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="h1" style={{ fontSize: isMobile ? '1.25rem' : '2.125rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cartões</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>
            {cards.length} {isMobile ? 'ativos' : 'cartões ativos'}
          </p>
        </div>
        <Button onClick={handleOpenAdd} style={{ padding: isMobile ? '0.5rem 0.875rem' : '0.75rem 1.25rem' }}>
          <Plus size={isMobile ? 18 : 20} /> <span style={{ fontSize: isMobile ? '0.8125rem' : '0.9375rem' }}>{isMobile ? 'Novo' : 'Novo Cartão'}</span>
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card padding="5rem 2rem" style={{ textAlign: 'center', background: '#ffffff' }}>
          <CardIcon size={64} style={{ color: 'var(--brand-100)', marginBottom: '1.5rem' }} />
          <h3 className="h3">Nenhum Cartão</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '300px', margin: '0.5rem auto' }}>
            Adicione cartões para centralizar o controle de faturas e limites em um só lugar.
          </p>
        </Card>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: isMobile ? '1.5rem' : '2rem',
          width: '100%'
        }}>
          {cards.map(card => (
            <div key={card.id} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <RealisticCard 
                banco={card.banco || 'Outros'}
                last4={card.last4 || '0000'}
                nome={card.nome}
                limite={card.limite}
                vencimento={card.vencimento}
              />
              
              <Card padding="1rem" style={{ background: '#ffffff', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} style={{ color: 'var(--brand-500)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--text-primary)' }}>R$ {card.limite.toLocaleString('pt-BR')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ color: 'var(--slate-500)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Vence dia {card.vencimento}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(card)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--slate-50)', border: '1px solid var(--slate-100)', color: 'var(--slate-600)' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(card.id)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--danger-50)', border: '1px solid var(--brand-100)', color: 'var(--danger-600)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* MODAL REDESIGNED - SOLID HIGH CONTRAST */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Cartão' : 'Novo Cartão'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* PREVIEW AREA */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            padding: '1rem',
            background: 'var(--slate-50)',
            borderRadius: '20px',
            border: '1.5px dashed var(--border-light)'
          }}>
            <RealisticCard 
              banco={banco} 
              last4={last4} 
              nome={nome || 'NOME NO CARTÃO'} 
              vencimento={vencimento}
            />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ color: 'var(--danger-700)', background: 'var(--danger-50)', padding: '1rem', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 900, border: '1px solid var(--danger-100)' }}>{error}</div>}
            
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04rem', display: 'block', marginBottom: '0.75rem' }}>Escolha o Banco</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                gap: '0.625rem',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {BANCOS_DISPONIVEIS.map(b => (
                  <button 
                    key={b}
                    type="button"
                    onClick={() => setBanco(b)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '12px',
                      border: `2.2px solid ${banco === b ? 'var(--brand-500)' : 'var(--border-light)'}`,
                      background: banco === b ? 'var(--brand-50)' : '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      color: banco === b ? 'var(--brand-600)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
               <Input label="Apelido do Cartão" value={nome} onChange={(e) => setNome(e.target.value.toUpperCase())} placeholder="Ex: NUBANK JONAS" icon={<CardIcon size={18} />} required />
              <Input label="Últimos 4 Dígitos" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 1234" icon={<ShieldCheck size={18} />} required />
            </div>
            
            <Input label="Limite Disponível" type="text" inputMode="numeric" value={limite} onChange={(e) => setLimite(maskCurrency(e.target.value))} placeholder="0,00" icon={<Zap size={18} />} required />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Dia Fechamento</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <select value={fechamento} onChange={(e) => setFechamento(e.target.value)} style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-light)', backgroundColor: '#ffffff', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 900, appearance: 'none' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Dia Vencimento</label>
                <div style={{ position: 'relative' }}>
                  <Settings size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <select value={vencimento} onChange={(e) => setVencimento(e.target.value)} style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-light)', backgroundColor: '#ffffff', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 900, appearance: 'none' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" fullWidth style={{ marginTop: '1rem', height: '56px', fontSize: '1.0625rem', fontWeight: 950 }}>
              {editingId ? 'Salvar Cartão' : 'Confirmar Cartão'}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
