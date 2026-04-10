import { create } from 'zustand';
import { ApiService } from '../services/apiService';
import type { User, Member, Category, Transaction, Investment, CreditCard } from '../models/PatrimonioModels';

interface FinanceState {
  user: User | null;
  setUser: (user: User | null) => void;
  members: Member[];
  categories: Category[];
  transactions: Transaction[];
  settings: Record<string, string>;
  investments: Investment[];
  cards: CreditCard[];

  loadInitialData: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  loadMembers: () => Promise<void>;
  addMember: (nome: string) => Promise<void>;
  updateMember: (id: string, nome: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  loadCategories: () => Promise<void>;
  addCategory: (nome: string, tipo: 'gasto' | 'receita') => Promise<void>;
  updateCategory: (id: string, nome: string, tipo: 'gasto' | 'receita') => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  loadSettings: () => Promise<void>;
  updateStartDay: (day: string) => Promise<void>;
  getCycleRange: () => { start: Date; end: Date };

  loadInvestments: () => Promise<void>;
  addInvestment: (payload: Omit<Investment, 'id' | 'usuarioId'>) => Promise<void>;
  updateInvestment: (id: string, payload: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  loadCards: () => Promise<void>;
  addCard: (card: Omit<CreditCard, 'id' | 'usuarioId'>) => Promise<void>;
  updateCard: (id: string, card: Partial<CreditCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  
  getInvoiceTransactions: (cardId: string, month: number, year: number) => Transaction[];
  updateFamilyPermissions: (blockedMenus: string) => Promise<void>;
  updateProfile: (data: { initialBalance: number; nome?: string }) => Promise<void>;
  reset: () => void;
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  transactions: [],
  members: [],
  categories: [],
  settings: { startDay: '10' },
  investments: [],
  cards: [],

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  loadInitialData: async () => {
    const { loadTransactions, loadMembers, loadCategories, loadSettings, loadInvestments, loadCards } = get();
    await Promise.all([
      loadTransactions(),
      loadMembers(),
      loadCategories(),
      loadSettings(),
      loadInvestments(),
      loadCards()
    ]);
  },

  loadTransactions: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const transactions = await ApiService.getTransactions(user.id);
      set({ transactions });
    } catch (err) { console.error('Erro ao carregar transações:', err); }
  },
  
  addTransaction: async (tx) => {
    const { user, cards, loadTransactions } = get();
    if (!user) return;

    const purchaseDate = parseLocalDate(tx.data);
    const purchaseDay = purchaseDate.getDate();

    if (tx.metodoPagamento === 'cartao') {
      const card = cards.find(c => c.id === tx.cartaoId);
      let invoiceMonth = purchaseDate.getMonth();
      let invoiceYear = purchaseDate.getFullYear();

      if (card && purchaseDay > card.fechamento) {
        invoiceMonth++;
        if (invoiceMonth > 11) {
          invoiceMonth = 0;
          invoiceYear++;
        }
      }

      const maturityDate = new Date(invoiceYear, invoiceMonth, card?.vencimento || 1, 12, 0, 0);
      if (maturityDate < purchaseDate) {
        maturityDate.setMonth(maturityDate.getMonth() + 1);
      }

      const { end: currentCycleEnd } = get().getCycleRange();
      let startMonthOffset = 0;
      if (maturityDate > currentCycleEnd) {
        startMonthOffset = 1;
      }

      if (tx.parcelasTotais && tx.parcelasTotais > 1) {
        const promises = [];
        const valorParcela = tx.valor / tx.parcelasTotais;

        for (let i = 0; i < tx.parcelasTotais; i++) {
          const installmentDate = new Date(purchaseDate);
          installmentDate.setMonth(purchaseDate.getMonth() + i + startMonthOffset);
          const dateStr = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}-${String(installmentDate.getDate()).padStart(2, '0')}`;

          promises.push(ApiService.createTransaction({
            ...tx,
            descricao: `${tx.descricao} (${i + 1}/${tx.parcelasTotais})`,
            valor: valorParcela,
            data: dateStr,
            parcelaAtual: i + 1,
            usuarioId: user.id
          }));
        }
        await Promise.all(promises);
        await loadTransactions();
      } else {
        const installmentDate = new Date(purchaseDate);
        if (startMonthOffset > 0) {
          installmentDate.setMonth(purchaseDate.getMonth() + startMonthOffset);
        }
        const dateStr = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}-${String(installmentDate.getDate()).padStart(2, '0')}`;
        
        const newTx = await ApiService.createTransaction({ 
          ...tx, 
          data: dateStr,
          usuarioId: user.id 
        });
        set(state => ({ transactions: [...state.transactions, newTx] }));
      }
    } else {
      const newTx = await ApiService.createTransaction({ ...tx, usuarioId: user.id });
      set(state => ({ transactions: [...state.transactions, newTx] }));
    }
  },

  updateTransaction: async (id, tx) => {
    const updated = await ApiService.updateTransaction(id, tx);
    set(state => ({
      transactions: state.transactions.map(t => t.id === id ? updated : t)
    }));
  },

  deleteTransaction: async (id) => {
    await ApiService.deleteTransaction(id);
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id)
    }));
  },

  loadMembers: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const members = await ApiService.getMembers(user.id);
      set({ members });
    } catch (err) { console.error('Erro ao carregar membros:', err); }
  },
  addMember: async (nome) => {
    const { user } = get();
    if (!user) return;
    const newMember = await ApiService.createMember({ nome, usuarioId: user.id });
    set(state => ({ members: [...state.members, newMember] }));
  },
  updateMember: async (id, nome) => {
    const updated = await ApiService.updateMember(id, { nome });
    set(state => ({
      members: state.members.map(m => m.id === id ? updated : m)
    }));
  },
  deleteMember: async (id) => {
    await ApiService.deleteMember(id);
    set(state => ({
      members: state.members.filter(m => m.id !== id)
    }));
  },

  loadCategories: async () => {
    try {
      const categories = await ApiService.getCategories();
      set({ categories });
    } catch (err) { console.error('Erro ao carregar categorias:', err); }
  },
  addCategory: async (nome, tipo) => {
    const newCat = await ApiService.createCategory({ nome, tipo });
    set(state => ({ categories: [...state.categories, newCat] }));
  },
  updateCategory: async (id, nome, tipo) => {
    const updated = await ApiService.updateCategory(id, { nome, tipo });
    set(state => ({
      categories: state.categories.map(c => c.id === id ? updated : c)
    }));
  },
  deleteCategory: async (id) => {
    await ApiService.deleteCategory(id);
    set(state => ({
      categories: state.categories.filter(c => c.id !== id)
    }));
  },

  loadSettings: async () => {
    try {
      const settings = await ApiService.getSettings();
      set({ settings: settings || { startDay: '10' } });
    } catch (err) { console.error('Erro ao carregar settings:', err); }
  },
  updateStartDay: async (day) => {
    await ApiService.updateSetting('startDay', day);
    set(state => ({ settings: { ...state.settings, startDay: day } }));
  },
  getCycleRange: () => {
    const { settings } = get();
    const startDay = Number.parseInt(settings?.startDay || '10');
    const today = new Date();
    let start: Date;
    let end: Date;

    if (today.getDate() >= startDay) {
      start = new Date(today.getFullYear(), today.getMonth(), startDay, 12, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth() + 1, startDay - 1, 23, 59, 59);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - 1, startDay, 12, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth(), startDay - 1, 23, 59, 59);
    }
    return { start, end };
  },

  loadInvestments: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const investments = await ApiService.getInvestments(user.id);
      set({ investments: investments || [] });
    } catch (err) {
      console.error('Erro ao carregar investimentos:', err);
      set({ investments: [] });
    }
  },
  addInvestment: async (payload) => {
    const { user } = get();
    if (!user) throw new Error('Usuário não logado');
    const newInv = await ApiService.createInvestment({ ...payload, usuarioId: user.id });
    set(state => ({ investments: [...state.investments, newInv] }));
  },
  updateInvestment: async (id, payload) => {
    const updated = await ApiService.updateInvestment(id, payload);
    set(state => ({
      investments: state.investments.map(i => i.id === id ? updated : i)
    }));
  },
  deleteInvestment: async (id) => {
    await ApiService.deleteInvestment(id);
    set(state => ({
      investments: state.investments.filter(i => i.id !== id)
    }));
  },

  loadCards: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const cards = await ApiService.getCards(user.id);
      set({ cards });
    } catch (err) { console.error('Erro ao carregar cartões:', err); }
  },
  addCard: async (payload) => {
    const { user } = get();
    if (!user) return;
    const newCard = await ApiService.createCard({ ...payload, usuarioId: user.id });
    set(state => ({ cards: [...state.cards, newCard] }));
  },
  updateCard: async (id, payload) => {
    await ApiService.updateCard(id, payload);
    const { user } = get();
    if (user) {
      const cards = await ApiService.getCards(user.id);
      set({ cards });
    }
  },
  deleteCard: async (id) => {
    await ApiService.deleteCard(id);
    set(state => ({ cards: state.cards.filter(c => c.id !== id) }));
  },

  getInvoiceTransactions: (cardId, month, year) => {
    const { transactions } = get();
    return transactions.filter(t => {
      if (t.metodoPagamento !== 'cartao' || t.cartaoId !== cardId) return false;
      const d = parseLocalDate(t.data);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  },

  updateFamilyPermissions: async (blockedMenus) => {
    const { user, setUser } = get();
    if (!user || !user.familyId) return;
    
    await ApiService.updateFamilyPermissions({
      familyId: user.familyId,
      usuarioId: user.id,
      blockedMenus
    });

    const updatedUser = { 
      ...user, 
      family: { ...user.family, blockedMenus } 
    };
    setUser(updatedUser as any);
  },

  updateProfile: async (data) => {
    const { user, setUser } = get();
    if (!user) return;
    try {
      const response = await ApiService.updateProfile({ 
        usuarioId: user.id, 
        ...data 
      });
      setUser(response.user);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
  },

  reset: () => {
    localStorage.removeItem('user');
    set({
      user: null,
      transactions: [],
      members: [],
      categories: [],
      settings: { startDay: '10' },
      investments: [],
      cards: []
    });
  }
}));
