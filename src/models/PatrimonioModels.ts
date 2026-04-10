export interface Family {
  id: string;
  nome: string;
  inviteCode: string;
  blockedMenus?: string; // Comma separated keys
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'HEAD' | 'MEMBER';
  familyId?: string;
  family?: Family;
  initialBalance?: number;
}

export interface Member {
  id: string;
  nome: string;
  usuarioId: string;
}

export type CategoryType = 'receita' | 'gasto';

export interface Category {
  id: string;
  nome: string;
  tipo: CategoryType;
}

export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  data: string; // ISO String (YYYY-MM-DD)
  categoriaId: string;
  membroId: string;
  usuarioId: string;
  tipo: CategoryType;
  // Campos de Pagamento e Parcelamento
  metodoPagamento?: 'dinheiro' | 'cartao';
  cartaoId?: string;
  parcelaAtual?: number;
  parcelasTotais?: number;
  createdAt?: string; // ISO String from DB
  category?: { nome: string; tipo: string };
  member?: { nome: string };
}

// Extensão de Transaction para views detalhadas com join
export interface TransactionDetailed extends Transaction {
  categoriaNome?: string;
  membroNome?: string;
  cartaoNome?: string;
}

export type InvestmentType = 'poupança' | 'bolsa' | 'renda_fixa' | 'cripto' | 'previdencia';

export interface Investment {
  id: string;
  descricao: string;
  valor: number;
  tipo: InvestmentType;
  usuarioId: string;
  meta?: number; // Valor alvo do investimento
}

export interface CreditCard {
  id: string;
  nome: string;
  limite: number;
  fechamento: number; // Dia de fechamento da fatura
  vencimento: number; // Dia de vencimento da fatura
  banco: string;
  last4: string;
  usuarioId: string;
}
