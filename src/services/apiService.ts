import type { Transaction, User, Member, Category, Investment, CreditCard } from '../models/PatrimonioModels';

const API_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    const errorMessage = errorBody.details ? `${errorBody.error}: ${errorBody.details}` : (errorBody.error ?? 'Erro na requisição');
    throw new Error(errorMessage);
  }
  return res.json();
}

export const ApiService = {
  // Auth
  login: (email: string, senha: string) =>
    request<{ message: string; user: User }>(`${API_URL}/auth/login`, {
      method: 'POST', body: JSON.stringify({ email, senha }),
    }),

  register: (nome: string, email: string, senha: string, inviteCode?: string) =>
    request<{ message: string; user: User }>(`${API_URL}/auth/register`, {
      method: 'POST', body: JSON.stringify({ nome, email, senha, inviteCode }),
    }),

  // Transactions
  getTransactions: (usuarioId: string) =>
    request<Transaction[]>(`${API_URL}/transactions/${usuarioId}`),

  createTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'> & { usuarioId: string }) =>
    request<{ transaction: Transaction }>(`${API_URL}/transactions`, {
      method: 'POST', body: JSON.stringify(tx),
    }).then(d => d.transaction),

  updateTransaction: (id: string, tx: Partial<Transaction>) =>
    request<Transaction>(`${API_URL}/transactions/${id}`, {
      method: 'PUT', body: JSON.stringify(tx),
    }),

  deleteTransaction: (id: string) =>
    request<void>(`${API_URL}/transactions/${id}`, { method: 'DELETE' }),

  // Members
  getMembers: (usuarioId: string) =>
    request<Member[]>(`${API_URL}/members/${usuarioId}`),

  createMember: (data: { nome: string; usuarioId: string }) =>
    request<Member>(`${API_URL}/members`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  updateMember: (id: string, data: { nome: string }) =>
    request<Member>(`${API_URL}/members/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),

  deleteMember: (id: string) =>
    request<void>(`${API_URL}/members/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () =>
    request<Category[]>(`${API_URL}/categories`),

  createCategory: (data: { nome: string; tipo: string }) =>
    request<Category>(`${API_URL}/categories`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { nome: string; tipo: string }) =>
    request<Category>(`${API_URL}/categories/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<void>(`${API_URL}/categories/${id}`, { method: 'DELETE' }),

  // Invoice AI
  parseInvoice: (images: Array<{ base64: string, mimeType: string }>) =>
    request<{ items: Array<{ descricao: string; valor: number; data: string; tipo: string }> }>(
      `${API_URL}/invoice/parse`,
      { method: 'POST', body: JSON.stringify({ images }) },
    ),
    
  // Settings
  getSettings: () =>
    request<Record<string, string>>(`${API_URL}/settings`),

  updateSetting: (key: string, value: string) =>
    request<Record<string, string>>(`${API_URL}/settings/update`, {
      method: 'POST', body: JSON.stringify({ key, value }),
    }),

  // Investimentos
  getInvestments: (usuarioId: string) =>
    request<Investment[]>(`${API_URL}/investments/${usuarioId}`),

  createInvestment: (payload: Omit<Investment, 'id'>) =>
    request<Investment>(`${API_URL}/investments`, {
      method: 'POST', body: JSON.stringify(payload),
    }),

  updateInvestment: (id: string, payload: Partial<Investment>) =>
    request<Investment>(`${API_URL}/investments/${id}`, {
      method: 'PUT', body: JSON.stringify(payload),
    }),

  deleteInvestment: (id: string) =>
    request<void>(`${API_URL}/investments/${id}`, { method: 'DELETE' }),

  // Cartões de Crédito
  getCards: (usuarioId: string) =>
    request<CreditCard[]>(`${API_URL}/cards/${usuarioId}`),

  createCard: (data: Omit<CreditCard, 'id'>) =>
    request<CreditCard>(`${API_URL}/cards`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  updateCard: (id: string, data: Partial<CreditCard>) =>
    request<CreditCard>(`${API_URL}/cards/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),

  deleteCard: (id: string) =>
    request<void>(`${API_URL}/cards/${id}`, { method: 'DELETE' }),

  // Generic POST (Legacy/Utility)
  post: (url: string, body: any) =>
    request<any>(`${API_URL}${url}`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  updateProfile: (data: { usuarioId: string; initialBalance?: number; nome?: string }) =>
    request<{ user: User }>(`${API_URL}/auth/update-profile`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  joinFamily: (inviteCode: string, usuarioId: string) =>
    request<{ user: User }>(`${API_URL}/auth/join-family`, {
      method: 'POST', body: JSON.stringify({ inviteCode, usuarioId }),
    }),

  updateFamilyPermissions: (data: { familyId: string; blockedMenus: string; usuarioId: string }) =>
    request<{ family: any }>(`${API_URL}/auth/update-permissions`, {
      method: 'POST', body: JSON.stringify(data),
    }),
};
