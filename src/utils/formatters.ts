/**
 * Utilitários de formatação para o FamilyFlow
 */

export const formatCurrencyBRL = (value: number | string): string => {
  const amount = typeof value === 'string' ? Number(value.replace(/\D/g, '')) / 100 : value;
  if (Number.isNaN(amount)) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseCurrencyBRL = (value: string): number => {
  if (!value) return 0;
  // Remove tudo que não é dígito e divide por 100 para ter o valor real
  const cleanValue = value.replace(/\D/g, '');
  return Number(cleanValue) / 100;
};

/**
 * Máscara para Input - Aplica a formatação enquanto o usuário digita
 */
export const maskCurrency = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  
  const amount = Number(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
  }).format(amount);
};
