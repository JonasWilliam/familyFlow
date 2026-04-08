import React from 'react';
import { 
  UtensilsCrossed, Pizza, ShoppingBag, Car, HeartPulse, 
  PartyPopper, GraduationCap, Home, CreditCard, 
  Wallet, DollarSign, Gift, TrendingUp, Settings,
  Plane, ShoppingCart, Coffee, Dumbbell, Zap,
  Briefcase
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  type?: 'gasto' | 'receita';
}

const iconMap: Record<string, any> = {
  // Comida e Delivery
  'alimentacao': UtensilsCrossed,
  'comida': UtensilsCrossed,
  'restaurante': UtensilsCrossed,
  'delivery': Pizza,
  'ifood': Pizza,
  '99food': Pizza,
  '99 food': Pizza,
  'hamburguer': Pizza,
  'pizza': Pizza,
  'lanche': Pizza,
  'batata frita': Pizza,
  'cafe': Coffee,
  'mercado': ShoppingCart,
  'supermercado': ShoppingCart,
  'sacolao': ShoppingCart,

  // Saúde
  'saude': HeartPulse,
  'farmacia': HeartPulse,
  'remedio': HeartPulse,
  'medico': HeartPulse,
  'hospital': HeartPulse,
  'academia': Dumbbell,
  'crossfit': Dumbbell,

  // Transporte
  'transporte': Car,
  'uber': Car,
  'combustivel': Zap,
  'gasolina': Zap,
  'viagem': Plane,

  // Casa / Fixos
  'moradia': Home,
  'aluguel': Home,
  'internet': Zap,
  'luz': Zap,
  'energia': Zap,
  'gas': Zap,
  'condominio': Home,

  // Lazer / Diversão
  'lazer': PartyPopper,
  'festa': PartyPopper,
  'cinema': PartyPopper,
  'futilidade': ShoppingBag,
  'futilidades': ShoppingBag,
  'compras': ShoppingBag,

  // Educação
  'educacao': GraduationCap,
  'curso': GraduationCap,
  'escola': GraduationCap,

  // Financeiro
  'cartao': CreditCard,
  'cartoes': CreditCard,
  'fatura': CreditCard,
  'salario': Wallet,
  'investimento': TrendingUp,
  'rendimentos': TrendingUp,
  'bonus': Gift,
  'extra': Gift,
  'trabalho': Briefcase,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, size = 18, className, color, type }) => {
  const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Tenta encontrar o ícone por palavra-chave
  let IconComponent = null;
  for (const key in iconMap) {
    if (normalizedName.includes(key)) {
      IconComponent = iconMap[key];
      break;
    }
  }

  // Fallback se não encontrar
  if (!IconComponent) {
    IconComponent = type === 'receita' ? DollarSign : Settings;
  }

  return <IconComponent size={size} className={className} style={{ color }} />;
};
