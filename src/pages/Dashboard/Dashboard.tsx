import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { 
  CreditCard, ArrowUpRight, ArrowDownRight, 
  ChevronDown, ChevronUp, Receipt, PieChart
} from 'lucide-react';

export const Dashboard = () => {
  const { 
    transactions, investments, getCycleRange, loadInitialData, user, cards, categories
  } = useFinanceStore();

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
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
  const saldoDisponivelReal = totalReceitasHist - totalGastosReaisHist - totalPatrimonio;

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
    [...cycleTransactions].sort((a, b) => new Date(b.data + 'T12:00:00').getTime() - new Date(a.data + 'T12:00:00').getTime())
  , [cycleTransactions]);

  const paginatedTxs = sortedCycleTxs.slice(txPage * txItemsPerPage, (txPage + 1) * txItemsPerPage);
  const hasNextPage = (txPage + 1) * txItemsPerPage < sortedCycleTxs.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Welcome & Global Summary */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--brand-700), var(--brand-900))',
        padding: '2rem',
        borderRadius: 'var(--radius-2xl)',
        color: 'white',
        boxShadow: 'var(--shadow-brand)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 1, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Olá, {firstName}! ✨</h2>
              <p style={{ opacity: 0.8, marginTop: '0.25rem', fontWeight: 500, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.9)' }}>Ciclo: {start.toLocaleDateString('pt-BR')} — {end.toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.15rem' }}>Saldo Disponível Real</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>R$ {saldoDisponivelReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', height: '40px', alignSelf: 'center' }} />
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.15rem' }}>Resultado do Mês</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: resultadoCiclo >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>R$ {resultadoCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', height: '40px', alignSelf: 'center' }} />
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.15rem' }}>Patrimônio Total</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Main KPI Flow (Resumo Rápido) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem' 
      }}>
        <Card className="glass elevation-1" padding="1.25rem" style={{ borderLeft: '4px solid var(--success-500)', background: 'rgba(255,255,255,0.9)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Receitas Ciclo</p>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-600)' }}>R$ {totalReceitasCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </Card>

        <Card className="glass elevation-1" padding="1.25rem" style={{ borderLeft: '4px solid var(--danger-500)', background: 'rgba(255,255,255,0.9)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Gastos Ciclo</p>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger-600)' }}>R$ {totalGastosCiclo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </Card>

        <Card className="glass elevation-1" padding="1.25rem" style={{ borderLeft: '4px solid var(--warning-500)', background: 'rgba(255,255,255,0.9)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cartão (Faturas)</p>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning-600)' }}>R$ {totalCardFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </Card>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.8fr 1.2fr', 
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Column: Invoices Detailing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="h3">Resumo das Faturas</h3>
            <Link to="/cards" style={{ fontSize: '0.8125rem', color: 'var(--brand-600)', fontWeight: 700, textDecoration: 'none' }}>Gerenciar Cartões</Link>
          </div>

          {Object.keys(invoiceData).length === 0 ? (
            <Card className="glass" padding="3rem" style={{ textAlign: 'center', background: 'var(--slate-50)' }}>
              <Receipt size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Nenhum gasto no cartão este mês.</p>
            </Card>
          ) : (
            Object.entries(invoiceData).map(([cardId, data]) => {
              const card = cards.find(c => c.id === cardId);
              const isExpanded = expandedCard === cardId;
              
              return (
                <Card key={cardId} className="glass" padding="0" hover={false} style={{ overflow: 'hidden' }}>
                  <div 
                    onClick={() => setExpandedCard(isExpanded ? null : cardId)}
                    style={{ 
                      padding: '1.25rem', cursor: 'pointer', display: 'flex', 
                      justifyContent: 'space-between', alignItems: 'center',
                      background: isExpanded ? 'var(--slate-50)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: 'white', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <CreditCard size={18} style={{ color: 'var(--brand-600)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{card?.nome || 'Cartão não identificado'}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{data.items.length} lançamentos</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '1.0625rem' }}>R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                      {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="animate-fade-in" style={{ 
                      padding: '0 1.25rem 1.25rem', 
                      background: 'var(--slate-50)',
                      borderTop: '1px solid var(--border-light)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        {data.items.map((item) => (
                          <div key={item.id} style={{ 
                            display: 'flex', justifyContent: 'space-between', 
                            padding: '0.75rem', background: 'white', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)'
                          }}>
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{item.descricao}</p>
                              <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                                {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')} • {getCategoryName(item.categoriaId)}
                              </p>
                            </div>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--danger-600)' }}>
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

        {/* Column: Latest/Quick View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="h3">Últímos Lançamentos</h3>
            <Link to="/transactions" style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Ver tudo</Link>
          </div>

          <Card className="glass" padding="0" hover={false}>
            {cycleTransactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Receipt size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Sem movimentações.</p>
              </div>
            ) : (
              <div>
                {paginatedTxs.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                    borderBottom: i < paginatedTxs.length - 1 ? '1px solid var(--border-light)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: tx.tipo === 'receita' ? 'var(--success-50)' : 'var(--danger-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CategoryIcon 
                          name={getCategoryName(tx.categoriaId)} 
                          type={tx.tipo as 'gasto' | 'receita'}
                          size={18}
                          color={tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)'}
                        />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{tx.descricao ? tx.descricao.split('(')[0] : '—'}</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p style={{ 
                      fontWeight: 800, fontSize: '0.8125rem',
                      color: tx.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)'
                    }}>
                      {tx.tipo === 'receita' ? '+' : '−'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                
                {/* Controles de Paginação Mini */}
                <div style={{ 
                  display: 'flex', justifyContent: 'center', gap: '1rem', 
                  padding: '0.75rem', borderTop: '1px solid var(--border-light)' 
                }}>
                  <button 
                    disabled={txPage === 0}
                    onClick={() => setTxPage(prev => prev - 1)}
                    style={{ 
                      padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', 
                      background: 'white', cursor: txPage === 0 ? 'not-allowed' : 'pointer',
                      opacity: txPage === 0 ? 0.3 : 1
                    }}
                  >
                    <ArrowDownRight size={14} style={{ transform: 'rotate(135deg)' }} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{txPage + 1}</span>
                  <button 
                    disabled={!hasNextPage}
                    onClick={() => setTxPage(prev => prev + 1)}
                    style={{ 
                      padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', 
                      background: 'white', cursor: !hasNextPage ? 'not-allowed' : 'pointer',
                      opacity: !hasNextPage ? 0.3 : 1
                    }}
                  >
                    <ArrowUpRight size={14} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Patrimonio BREAKDOWN */}
          <Card className="glass" padding="1.25rem" style={{ 
            background: 'var(--slate-800)',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '6px' }}>
                <PieChart size={18} />
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>Alocação por Tipo</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alocacaoPatrimonio.length === 0 ? (
                <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Sem investimentos registrados.</p>
              ) : alocacaoPatrimonio.map(item => (
                <div key={item.tipo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>{item.tipo.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.percent.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                    <div style={{ 
                      width: `${item.percent}%`, 
                      height: '100%', 
                      background: 'var(--brand-400)', 
                      borderRadius: '10px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <p style={{ fontSize: '0.625rem', opacity: 0.5, textAlign: 'right', marginTop: '0.2rem' }}>
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
