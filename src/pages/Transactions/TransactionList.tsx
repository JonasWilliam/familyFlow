import { useEffect, useState, useMemo } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import {
  Receipt, Plus, Pencil, Trash2,
  FileText, DollarSign, Calendar, Search, 
  ChevronLeft, ChevronRight,
  ArrowDownAZ, ArrowUpAZ, AlertCircle
} from 'lucide-react';

import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '../../utils/formatters';

export const TransactionList = () => {
  const {
    transactions, loadTransactions, addTransaction, updateTransaction, deleteTransaction,
    members, loadMembers,
    categories, loadCategories, getCycleRange,
    cards, loadCards
  } = useFinanceStore();
  const isMobile = useIsMobile();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Estados de Formulário
  const today = new Date().toLocaleDateString('en-CA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(today);
  const [categoriaId, setCategoriaId] = useState('');
  const [membroId, setMembroId] = useState('');
  const [tipo, setTipo] = useState<'gasto' | 'receita'>('gasto');
  
  // Novos Estados
  const [metodoPagamento, setMetodoPagamento] = useState<'dinheiro' | 'cartao'>('dinheiro');
  const [cartaoId, setCartaoId] = useState('');
  const [parcelasTotais, setParcelasTotais] = useState('1');

  // Estados de Filtro, Ordenação e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'cycle' | 'prev' | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Estados de Deleção
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadMembers();
    loadCategories();
    loadCards();
  }, [loadTransactions, loadMembers, loadCategories, loadCards]);

  // Lógica de Filtragem e Ordenação
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filtro de Período
    if (filterPeriod === 'cycle') {
      const { start, end } = getCycleRange();
      result = result.filter(t => {
        const d = new Date(t.data + 'T12:00:00');
        return d >= start && d <= end;
      });
    } else if (filterPeriod === 'prev') {
      const { start } = getCycleRange();
      const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate());
      const prevMonthEnd = new Date(start.getTime() - 1000);
      result = result.filter(t => {
        const d = new Date(t.data + 'T12:00:00');
        return d >= prevMonthStart && d <= prevMonthEnd;
      });
    }

    // Filtro de Busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.descricao.toLowerCase().includes(term) ||
        categories.find(c => c.id === t.categoriaId)?.nome.toLowerCase().includes(term)
      );
    }

    // Ordenação Dinâmica: Prioriza Data e usa createdAt como desempate para sequência exata
    return result.sort((a, b) => {
      const dateA = new Date(a.data + 'T12:00:00').getTime();
      const dateB = new Date(b.data + 'T12:00:00').getTime();
      
      if (dateA !== dateB) {
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }

      // Se for o mesmo dia, usa o horário de inserção (createdAt)
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, filterPeriod, searchTerm, getCycleRange, categories, sortOrder]);

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Auto-seleção resiliente: Se os dados carregarem depois do modal abrir, preenchemos
  useEffect(() => {
    if (modalOpen && !editingId) {
      if (!membroId && members.length > 0) setMembroId(members[0].id);
      if (!categoriaId && categories.length > 0) {
        const defaultCat = categories.find(c => c.tipo === tipo && c.nome.toLowerCase().includes('outros')) || categories.find(c => c.tipo === tipo);
        if (defaultCat) setCategoriaId(defaultCat.id);
      }
    }
  }, [modalOpen, editingId, members, categories, tipo, membroId, categoriaId]);

  const resetForm = () => {
    setDescricao('');
    setValor('');
    setData(new Date().toLocaleDateString('en-CA'));
    // Auto seleção inteligente
    const defaultCategory = categories.find(c => c.tipo === 'gasto' && c.nome.toLowerCase().includes('outros')) || categories.find(c => c.tipo === 'gasto');
    setCategoriaId(defaultCategory ? defaultCategory.id : '');
    setMembroId(members.length > 0 ? members[0].id : '');
    setTipo('gasto');
    setMetodoPagamento('dinheiro');
    setCartaoId('');
    setParcelasTotais('1');
    setEditingId(null);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload: any = { 
      descricao, 
      valor: parseCurrencyBRL(valor), 
      data, 
      categoriaId, 
      membroId, 
      tipo,
      metodoPagamento,
      cartaoId: (metodoPagamento === 'cartao' && cartaoId) ? cartaoId : undefined,
      parcelasTotais: metodoPagamento === 'cartao' ? Number(parcelasTotais) : 1
    };

    try {
      if (!membroId) throw new Error('Por favor, selecione quem realizou o lançamento.');
      if (!categoriaId) throw new Error('Por favor, selecione a categoria.');
      
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const openEdit = (tx: any) => {
    setEditingId(tx.id);
    setDescricao(tx.descricao);
    setValor(formatCurrencyBRL(tx.valor));
    setData(tx.data);
    setCategoriaId(tx.categoriaId);
    setMembroId(tx.membroId);
    setTipo(tx.tipo as 'gasto' | 'receita');
    setMetodoPagamento(tx.metodoPagamento || 'dinheiro');
    setCartaoId(tx.cartaoId || '');
    setParcelasTotais(String(tx.parcelasTotais || 1));
    setModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTargetId);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.nome ?? '—';
  const getMemberName = (id: string) => members.find(m => m.id === id)?.nome ?? '—';
  const getCardName = (id: string) => cards.find(c => c.id === id)?.nome ?? '—';

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6875rem 0.875rem',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    appearance: 'none',
    boxShadow: 'var(--shadow-xs)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.875rem center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="animate-fade-in" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Lançamentos</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {filteredTransactions.length} registros • Organizado por {sortOrder === 'desc' ? 'mais recente' : 'mais antigo'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              border: '1px solid var(--border-light)',
              color: 'var(--brand-600)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}
          >
            {sortOrder === 'desc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
            <span className="mobile-hidden">{sortOrder === 'desc' ? 'Recentes' : 'Antigos'}</span>
          </button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} /> <span className="mobile-hidden">Novo lançamento</span>
          </Button>
        </div>
      </div>

      <Card className="glass" padding="1rem">
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center' 
        }}>
          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1.1px solid var(--border-light)',
                background: 'white',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
            {(['cycle', 'prev', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setFilterPeriod(p); setCurrentPage(1); }}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: filterPeriod === p ? 'var(--brand-500)' : 'var(--slate-100)',
                  color: filterPeriod === p ? 'white' : 'var(--text-secondary)',
                }}
              >
                {p === 'cycle' ? 'Ciclo Atual' : p === 'prev' ? 'Anterior' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="glass animate-fade-in-delay-1" padding="0" hover={false} style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.7)' }}>
        {paginatedTransactions.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Receipt size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Nenhum registro encontrado</p>
          </div>
        ) : (
          <div>
            {paginatedTransactions.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.2)',
                borderBottom: i < paginatedTransactions.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: tx.tipo === 'receita' ? 'var(--success-50)' : 'var(--danger-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <CategoryIcon 
                      name={getCategoryName(tx.categoriaId) + ' ' + tx.descricao} 
                      type={tx.tipo as 'gasto' | 'receita'}
                      size={20}
                      color={tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)'}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{tx.descricao}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      {getCategoryName(tx.categoriaId)} • {getMemberName(tx.membroId)} • {new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {tx.metodoPagamento === 'cartao' && ` • 💳 ${getCardName(tx.cartaoId || '')}`}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontWeight: 800, fontSize: '1rem', fontVariantNumeric: 'tabular-nums',
                      color: tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)',
                    }}>
                      {tx.tipo === 'receita' ? '+' : '−'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {tx.parcelasTotais && tx.parcelasTotais > 1 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-600)', background: 'var(--brand-50)', padding: '2px 6px', borderRadius: '4px' }}>
                        PARCELA {tx.parcelaAtual}/{tx.parcelasTotais}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(tx)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none' }}><Pencil size={16} /></button>
                    <button onClick={() => confirmDelete(tx.id)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ 
            padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem'
          }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', border: '1px solid var(--border-light)', background: 'white', opacity: currentPage === 1 ? 0.4 : 1 }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}> {currentPage} de {totalPages} </span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', border: '1px solid var(--border-light)', background: 'white', opacity: currentPage === totalPages ? 0.4 : 1 }}><ChevronRight size={18} /></button>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar lançamento' : 'Novo lançamento'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
          
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--danger-200)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['gasto', 'receita'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-lg)', fontWeight: 700,
                  fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                  border: `2px solid ${tipo === t ? (t === 'receita' ? 'var(--success-500)' : 'var(--danger-500)') : 'var(--border-light)'}`,
                  background: tipo === t ? (t === 'receita' ? 'var(--success-50)' : 'var(--danger-50)') : 'white',
                  color: tipo === t ? (t === 'receita' ? 'var(--success-600)' : 'var(--danger-600)') : 'var(--text-secondary)',
                }}>
                {t === 'receita' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Mercado Mensal" icon={<FileText size={18} />} required />

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <Input 
              label="Valor Total (R$)" 
              type="text" 
              inputMode="numeric"
              value={valor} 
              onChange={(e) => setValor(maskCurrency(e.target.value))} 
              placeholder="0,00" 
              icon={<DollarSign size={18} />} 
              required 
            />
            <Input label="Data da Compra" type="date" value={data} onChange={(e) => setData(e.target.value)} icon={<Calendar size={18} />} required />
          </div>

          {tipo === 'gasto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Forma de Pagamento</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['dinheiro', 'cartao'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMetodoPagamento(m)}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', fontWeight: 600,
                      fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                      border: `1.5px solid ${metodoPagamento === m ? 'var(--brand-500)' : 'var(--border-light)'}`,
                      background: metodoPagamento === m ? 'var(--brand-50)' : 'white',
                      color: metodoPagamento === m ? 'var(--brand-600)' : 'var(--text-secondary)',
                    }}>
                    {m === 'dinheiro' ? '💵 Dinheiro/Pix' : '💳 Cartão de Crédito'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tipo === 'gasto' && metodoPagamento === 'cartao' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Escolha o Cartão</label>
                <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} required style={selectStyle}>
                  <option value="">Selecione um cartão...</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Número de Parcelas</label>
                <select value={parcelasTotais} onChange={(e) => setParcelasTotais(e.target.value)} style={selectStyle}>
                  {[1,2,3,4,5,6,7,8,9,10,12,15,18,24].map(n => <option key={n} value={n}>{n}x {n > 1 ? `(R$ ${(Number(parseCurrencyBRL(valor))/n).toLocaleString('pt-BR', {minimumFractionDigits: 2})} cada)` : ''}</option>)}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Categoria</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required style={selectStyle}>
                <option value="">Selecione...</option>
                {categories.filter(c => c.tipo === tipo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Membro</label>
              <select value={membroId} onChange={(e) => setMembroId(e.target.value)} required style={selectStyle}>
                <option value="">Quem?</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <Button fullWidth type="submit" style={{ marginTop: '0.5rem', height: '48px' }}>
            {editingId ? 'Salvar Alterações' : (metodoPagamento === 'cartao' && Number(parcelasTotais) > 1 ? `Confirmar ${parcelasTotais} Parcelas` : 'Confirmar Lançamento')}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Confirmar exclusão">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}> <Trash2 size={28} /> </div>
          <div> <h3 className="h3">Remover lançamento?</h3> <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}> Esta ação é permanente e removerá apenas esta parcela específica. </p> </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button fullWidth variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancelar</Button>
            <Button fullWidth onClick={handleDelete} loading={deleting} style={{ background: 'var(--danger-500)' }}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
