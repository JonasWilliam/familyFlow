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

import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '../../utils/formatters';

const BANCOS_DISPONIVEIS = [
  'Nubank', 'Inter', 'Itau', 'Santander', 'Bradesco', 'Banco do Brasil', 'Hipercard', 'Outros'
];

export const CardsManagement = () => {
  const { cards, loadCards, addCard, updateCard, deleteCard } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Meus Cartões</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Gerencie seus limites e visualize seus cartões físicos e virtuais
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} /> Novo Cartão
        </Button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '2rem' 
      }}>
        {cards.length === 0 ? (
          <Card className="glass" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center' }}>
            <CardIcon size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum cartão cadastrado</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Adicione seu primeiro cartão para gerenciar gastos parcelados.</p>
          </Card>
        ) : (
          cards.map(card => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <RealisticCard 
                banco={card.banco || 'Outros'}
                last4={card.last4 || '0000'}
                nome={card.nome}
                limite={card.limite}
                vencimento={card.vencimento}
              />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0 0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    F: Dia {card.fechamento} | V: Dia {card.vencimento}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                    Lim: R$ {card.limite.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(card)} className="btn-icon" style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', color: 'var(--slate-600)', cursor: 'pointer' }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(card.id)} className="btn-icon" style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--danger-100)', background: 'var(--danger-50)', color: 'var(--danger-600)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Cartão' : 'Novo Cartão'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--danger-600)', background: 'var(--danger-50)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>{error}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Banco Emissor</label>
              <select 
                value={banco} 
                onChange={(e) => setBanco(e.target.value)}
                style={{
                  padding: '0.625rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-light)',
                  background: 'var(--slate-50)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                {BANCOS_DISPONIVEIS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <Input 
              label="Últimos 4 Dígitos" 
              maxLength={4}
              value={last4} 
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} 
              placeholder="Ex: 1234" 
              icon={<ShieldCheck size={18} />} 
              required 
            />
          </div>

          <Input label="Apelido do Cartão" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Principal, Viagens, Virtual..." icon={<CardIcon size={18} />} required />
          
          <Input 
            label="Limite Total (R$)" 
            type="text" 
            inputMode="numeric"
            value={limite} 
            onChange={(e) => setLimite(maskCurrency(e.target.value))} 
            placeholder="0,00" 
            icon={<Zap size={18} />} 
            required 
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Dia de Fechamento" type="number" min="1" max="31" value={fechamento} onChange={(e) => setFechamento(e.target.value)} icon={<Calendar size={18} />} required />
            <Input label="Dia de Vencimento" type="number" min="1" max="31" value={vencimento} onChange={(e) => setVencimento(e.target.value)} icon={<Settings size={18} />} required />
          </div>

          <Button type="submit" fullWidth style={{ marginTop: '1rem' }}>
            {editingId ? 'Salvar Alterações' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
