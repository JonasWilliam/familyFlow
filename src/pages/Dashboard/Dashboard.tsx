import { useEffect, useState, useMemo } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Link } from 'react-router-dom';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { 
  CreditCard, ArrowUpRight, ArrowDownRight, 
  ChevronDown, ChevronUp, Receipt, PieChart,
  Wallet, TrendingUp, Calendar, ArrowRight,
  Plus, FileText, DollarSign
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { maskCurrency, parseCurrencyBRL } from '../../utils/formatters';

export const Dashboard = () => {
  const { 
    transactions, investments, getCycleRange, loadInitialData, user, cards, categories,
    addTransaction, members 
  } = useFinanceStore();

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(0);
  const isMobile = useIsMobile(768);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Modal State for FAB
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categoriaId, setCategoriaId] = useState('');
  const [membroId, setMembroId] = useState('');
  const [tipo, setTipo] = useState<'gasto' | 'receita'>('gasto');
  const [metodoPagamento, setMetodoPagamento] = useState<'dinheiro' | 'cartao'>('dinheiro');
  const [cartaoId, setCartaoId] = useState('');
  const [parcelasTotais, setParcelasTotais] = useState('1');

  const resetForm = () => {
    setDescricao('');
    setValor('');
    setData(new Date().toISOString().split('T')[0]);
    // Auto seleção inteligente
    const defaultCategory = categories.find(c => c.tipo === 'gasto' && c.nome.toLowerCase().includes('outros')) || categories.find(c => c.tipo === 'gasto');
    setCategoriaId(defaultCategory ? defaultCategory.id : '');
    setMembroId(members.length > 0 ? members[0].id : '');
    setTipo('gasto');
    setMetodoPagamento('dinheiro');
    setCartaoId('');
    setParcelasTotais('1');
    setError('');
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!membroId) throw new Error('Selecione quem realizou o lançamento.');
      if (!categoriaId) throw new Error('Selecione a categoria da compra.');

      await addTransaction({
        descricao,
        valor: parseCurrencyBRL(valor),
        data,
        categoriaId,
        membroId,
        tipo,
        metodoPagamento,
        cartaoId: metodoPagamento === 'cartao' ? cartaoId : undefined,
        parcelaAtual: 1,
        parcelasTotais: Number(parcelasTotais)
      });
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border-light)',
    background: '#ffffff',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
    outline: 'none'
  };
  
  const { start, end } = getCycleRange();

  // Transações do Ciclo Atual
  const cycleTransactions = useMemo(() => transactions.filter(t => {
    const d = new Date(t.data + 'T12:00:00');
    return d >= start && d <= end;
  }), [transactions, start, end]);

  // CÁLCULOS DE RESULTADO LÍQUIDO DO CICLO
  const totalReceitasCiclo = useMemo(() => 
    cycleTransactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)
  , [cycleTransactions]);

  const totalGastosCiclo = useMemo(() => 
    cycleTransactions.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.valor, 0)
  , [cycleTransactions]);

  const resultadoCiclo = totalReceitasCiclo - totalGastosCiclo;

  // SALDO DISPONÍVEL REAL: Todas as receitas - gastos não parcelados - patrimônio alocado
  const totalReceitasHist = useMemo(() => 
    transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)
  , [transactions]);

  const totalGastosReaisHist = useMemo(() => 
    transactions.filter(t => t.tipo === 'gasto' && t.metodoPagamento !== 'cartao').reduce((sum, t) => sum + t.valor, 0)
  , [transactions]);

  const totalPatrimonio = investments.reduce((sum, inv) => sum + inv.valor, 0);
  
  // NOVO CÁLCULO: Saldo Inicial + Receitas - Gastos (Dinheiro/Pix)
  // Os investimentos NÃO reduzem o caixa automaticamente, pois podem ser históricos.
  // Apenas uma transação de SAÍDA (Gasto) vinculada a um investimento reduziria o caixa.
  const initialBalance = user?.initialBalance || 0;
  const saldoDisponivelReal = initialBalance + totalReceitasHist - totalGastosReaisHist;
  const patrimonioLiquido = saldoDisponivelReal + totalPatrimonio;

  // Agrupamento de Faturas por Cartão
  const invoiceData = useMemo(() => {
    const data: Record<string, { total: number, items: typeof transactions }> = {};
    
    cycleTransactions.filter(t => t.metodoPagamento === 'cartao').forEach(t => {
      const cardId = t.cartaoId || 'unclassified';
      if (!data[cardId]) data[cardId] = { total: 0, items: [] };
      data[cardId].total += t.valor;
      data[cardId].items.push(t);
    });

    return data;
  }, [cycleTransactions]);

  const totalCardFaturas = Object.values(invoiceData).reduce((sum, d) => sum + d.total, 0);

  // ALOCAÇÃO DE PATRIMÔNIO POR TIPO
  const alocacaoPatrimonio = useMemo(() => {
    if (totalPatrimonio === 0) return [];
    
    const grouping: Record<string, number> = {};
    investments.forEach(inv => {
      grouping[inv.tipo] = (grouping[inv.tipo] || 0) + inv.valor;
    });

    return Object.entries(grouping).map(([tipo, valor]) => ({
      tipo,
      valor,
      percent: (valor / totalPatrimonio) * 100
    })).sort((a, b) => b.valor - a.valor);
  }, [investments, totalPatrimonio]);

  const firstName = user?.nome.split(' ')[0] ?? 'Usuário';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.nome ?? 'Outros';

  // PAGINAÇÃO ÚLTIMOS LANÇAMENTOS
  const txItemsPerPage = 5;
  const sortedCycleTxs = useMemo(() => 
    [...cycleTransactions].sort((a, b) => {
      const dateA = new Date(a.data + 'T12:00:00').getTime();
      const dateB = new Date(b.data + 'T12:00:00').getTime();
      if (dateA !== dateB) return dateB - dateA;
      
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
  , [cycleTransactions]);

  const paginatedTxs = sortedCycleTxs.slice(txPage * txItemsPerPage, (txPage + 1) * txItemsPerPage);
  const hasNextPage = (txPage + 1) * txItemsPerPage < sortedCycleTxs.length;

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2rem', 
      paddingBottom: '3rem' 
    }}>
      
      {/* HEADER: Dual Hero Sections */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '1.25rem' 
      }}>
        {/* HERO 1: Liquid Cash */}
        <Card className="glass" padding="0" hover={false} style={{ 
          background: 'linear-gradient(135deg, var(--brand-700), var(--brand-900))',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(37, 99, 235, 0.2)'
        }}>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Olá, {firstName}! ✨</h2>
                <p style={{ opacity: 0.8, fontSize: '0.7rem', fontWeight: 700 }}>Ciclo: {start.toLocaleDateString('pt-BR')} — {end.toLocaleDateString('pt-BR')}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '12px' }}>
                <Wallet size={20} />
              </div>
            </div>

            <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Dinheiro em Caixa</p>
              <div title="Total de receitas menos despesas e investimentos. É o que você tem disponível para gastar agora." style={{ cursor: 'help', opacity: 0.6 }}><PieChart size={10} /></div>
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              R$ {saldoDisponivelReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1rem 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase' }}>Resultado do Mês</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 900, color: resultadoCiclo >= 0 ? '#4ade80' : '#f87171' }}>
                R$ {resultadoCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Link to="/transactions" style={{ 
              color: 'white', 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              textDecoration: 'none'
            }}>
              Extrato <ArrowRight size={14} />
            </Link>
          </div>
        </Card>

        {/* HERO 2: Wealth Distribution */}
        <Card className="glass" padding="1.5rem" style={{ 
          background: 'white',
          border: '1px solid var(--brand-100)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 950, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Patrimônio Líquido</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--brand-900)', letterSpacing: '-0.04em' }}>
                  R$ {patrimonioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div style={{ background: 'var(--success-50)', padding: '0.5rem', borderRadius: '12px', color: 'var(--success-600)' }}>
                <TrendingUp size={22} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Investido</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'var(--brand-600)' }}>R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Liquidez</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'var(--success-600)' }}>{patrimonioLiquido > 0 ? ((saldoDisponivelReal / patrimonioLiquido) * 100).toFixed(0) : 0}%</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {alocacaoPatrimonio.slice(0, 3).map(item => (
              <div key={item.tipo} style={{ 
                padding: '4px 10px', background: 'var(--brand-50)', borderRadius: '20px', 
                fontSize: '0.6rem', fontWeight: 800, color: 'var(--brand-700)', textTransform: 'capitalize',
                border: '1px solid var(--brand-100)'
              }}>
                {item.tipo.replace('_', ' ')}: {item.percent.toFixed(0)}%
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* QUICK KPI ROW: Ultra Compact */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
        gap: isMobile ? '0.75rem' : '1rem' 
      }}>
        <Card className="glass" padding="1rem" style={{ border: 'none', background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--success-50)', color: 'var(--success-600)', padding: '0.5rem', borderRadius: '10px' }}>
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Ganhos do Ciclo</p>
              <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--slate-800)' }}>R$ {totalReceitasCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
        </Card>

        <Card className="glass" padding="1rem" style={{ border: 'none', background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', padding: '0.5rem', borderRadius: '10px' }}>
              <ArrowDownRight size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Gastos do Ciclo</p>
              <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--slate-800)' }}>R$ {totalGastosCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
        </Card>

        {(!user?.family?.blockedMenus?.includes('cards') || user?.role === 'HEAD') && (
          <Card className="glass" padding="1rem" style={{ border: 'none', background: 'rgba(255,255,255,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--warning-50)', color: 'var(--warning-500)', padding: '0.5rem', borderRadius: '10px' }}>
                <CreditCard size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Fatura Aberta</p>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--slate-800)' }}>R$ {totalCardFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* DETAILED CONTENT GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1.2fr', 
        gap: isMobile ? '1.5rem' : '2rem',
        alignItems: 'start'
      }}>
        
        {/* Column 1: Invoices */}
        {(!user?.family?.blockedMenus?.includes('cards') || user?.role === 'HEAD') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="h3" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Resumo das Faturas</h3>
              <Link to="/cards" className="hover-scale" style={{ fontSize: '0.75rem', color: 'var(--brand-600)', fontWeight: 800, textDecoration: 'none' }}>Gerenciar Cartões</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.keys(invoiceData).length === 0 ? (
                <Card padding="3rem" style={{ textAlign: 'center', background: 'white', border: '1px solid var(--border-light)' }}>
                  <Receipt size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem' }}>Nenhum gasto pendente em faturas.</p>
                </Card>
              ) : (
                Object.entries(invoiceData).map(([cardId, data]) => {
                  const card = cards.find(c => c.id === cardId);
                  const isExpanded = expandedCard === cardId;
                  
                  return (
                    <Card key={cardId} padding="0" hover={false} style={{ background: 'white' }}>
                      <div 
                        onClick={() => setExpandedCard(isExpanded ? null : cardId)}
                        style={{ 
                          padding: '1.25rem', cursor: 'pointer', display: 'flex', 
                          justifyContent: 'space-between', alignItems: 'center',
                          transition: 'background 0.25s'
                        }}
                        className="hover-bright"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: 'var(--brand-50)', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.03)'
                          }}>
                            <CreditCard size={20} style={{ color: 'var(--brand-500)' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{card?.nome || 'Cartão PJ'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{data.items.length} movimentações</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <h4 style={{ fontWeight: 900, fontSize: '1.0625rem', color: 'var(--slate-800)' }}>R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                          {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="animate-fade-in" style={{ 
                          padding: '0 1.25rem 1.25rem', 
                          borderTop: '1px solid var(--slate-100)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            {data.items.map((item) => (
                              <div key={item.id} style={{ 
                                display: 'flex', justifyContent: 'space-between', 
                                padding: '0.875rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--slate-100)'
                              }}>
                                <div>
                                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)' }}>{item.descricao}</p>
                                  <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')} • {getCategoryName(item.categoriaId)}
                                  </p>
                                </div>
                                <p style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--danger-600)' }}>
                                  R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Column 2: Activity List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="h3" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Últimas Atividades</h3>
            {(!user?.family?.blockedMenus?.includes('transactions') || user?.role === 'HEAD') && (
              <Link to="/transactions" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textDecoration: 'none' }}>Ver histórico</Link>
            )}
          </div>

          <Card padding="0" hover={false} style={{ background: 'white', border: '1px solid var(--border-light)' }}>
            {cycleTransactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Receipt size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Nenhum lançamento no período.</p>
              </div>
            ) : (
              <div>
                {paginatedTxs.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.25rem',
                    background: i % 2 === 0 ? 'white' : 'var(--slate-50)',
                    borderBottom: i < paginatedTxs.length - 1 ? '1px solid var(--slate-100)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: tx.tipo === 'receita' ? 'var(--success-50)' : 'var(--danger-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CategoryIcon 
                          name={getCategoryName(tx.categoriaId)} 
                          type={tx.tipo as 'gasto' | 'receita'}
                          size={20}
                          color={tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)'}
                        />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--slate-700)' }}>{tx.descricao ? tx.descricao.split('(')[0] : 'Lançamento'}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p style={{ 
                      fontWeight: 900, fontSize: '0.9375rem',
                      color: tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)'
                    }}>
                      {tx.tipo === 'receita' ? '+' : '−'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                <div style={{ 
                  display: 'flex', justifyContent: 'center', gap: '1.25rem', 
                  padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.03)' 
                }}>
                  <button 
                    disabled={txPage === 0}
                    onClick={() => setTxPage(prev => prev - 1)}
                    style={{ 
                      padding: '8px', borderRadius: '10px', border: '1px solid var(--border-light)', 
                      background: 'white', cursor: txPage === 0 ? 'not-allowed' : 'pointer',
                      opacity: txPage === 0 ? 0.3 : 1, transition: 'all 0.2s'
                    }}
                    className="hover-bright"
                  >
                    <ArrowDownRight size={16} style={{ transform: 'rotate(135deg)', color: 'var(--slate-600)' }} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--slate-900)' }}>{txPage + 1}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--slate-400)' }}>/</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--slate-400)' }}>{Math.ceil(sortedCycleTxs.length / txItemsPerPage)}</span>
                  </div>
                  <button 
                    disabled={!hasNextPage}
                    onClick={() => setTxPage(prev => prev + 1)}
                    style={{ 
                      padding: '8px', borderRadius: '10px', border: '1px solid var(--border-light)', 
                      background: 'white', cursor: !hasNextPage ? 'not-allowed' : 'pointer',
                      opacity: !hasNextPage ? 0.3 : 1, transition: 'all 0.2s'
                    }}
                    className="hover-bright"
                  >
                    <ArrowUpRight size={16} style={{ transform: 'rotate(45deg)', color: 'var(--slate-600)' }} />
                  </button>
                </div>
              </div>
            )}
          </Card>

          </div>
        </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => { resetForm(); setModalOpen(true); }}
        className="hover-scale"
        style={{
          position: 'fixed',
          bottom: isMobile ? '1.5rem' : '2.5rem',
          right: isMobile ? '1.5rem' : '2.5rem',
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(37, 99, 235, 0.45)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Plus size={isMobile ? 28 : 32} />
      </button>

      {/* Quick Transaction Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Lançamento Rápido">
        <form onSubmit={handleQuickSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--danger-200)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={16} /> {error}
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

          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Mercado" icon={<FileText size={18} />} required />

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <Input 
              label="Valor (R$)" 
              type="text" 
              inputMode="numeric"
              value={valor} 
              onChange={(e) => setValor(maskCurrency(e.target.value))} 
              placeholder="0,00" 
              icon={<DollarSign size={18} />} 
              required 
            />
            <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} icon={<Calendar size={18} />} required />
          </div>

          {tipo === 'gasto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pagamento</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['dinheiro', 'cartao'] as const).filter(m => m !== 'cartao' || !user?.family?.blockedMenus?.includes('cards') || user?.role === 'HEAD').map((m) => (
                  <button key={m} type="button" onClick={() => setMetodoPagamento(m)}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', fontWeight: 600,
                      fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                      border: `1.5px solid ${metodoPagamento === m ? 'var(--brand-500)' : 'var(--border-light)'}`,
                      background: metodoPagamento === m ? 'var(--brand-50)' : 'white',
                      color: metodoPagamento === m ? 'var(--brand-600)' : 'var(--text-secondary)',
                    }}>
                    {m === 'dinheiro' ? '💵 Dinheiro/Pix' : '💳 Cartão'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tipo === 'gasto' && metodoPagamento === 'cartao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)' }}>
              <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} required style={selectStyle}>
                <option value="">Selecione o cartão...</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select value={parcelasTotais} onChange={(e) => setParcelasTotais(e.target.value)} style={selectStyle}>
                {[1,2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x {n > 1 ? `parcelas` : ''}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required style={selectStyle}>
              <option value="">Categoria...</option>
              {categories.filter(c => c.tipo === tipo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={membroId} onChange={(e) => setMembroId(e.target.value)} required style={selectStyle}>
              <option value="">Membro...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <Button fullWidth type="submit" loading={loading} style={{ marginTop: '0.5rem', height: '48px' }}>
            Confirmar Lançamento
          </Button>
        </form>
      </Modal>
    </div>
  );
};

