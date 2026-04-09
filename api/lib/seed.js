const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  const defaultCategories = [
    // Gastos
    { nome: 'Dívidas Fixas', tipo: 'gasto' },
    { nome: 'Alimentação', tipo: 'gasto' },
    { nome: 'Delivery', tipo: 'gasto' },
    { nome: 'Saúde', tipo: 'gasto' },
    { nome: 'Transporte', tipo: 'gasto' },
    { nome: 'Lazer', tipo: 'gasto' },
    { nome: 'Futilidades', tipo: 'gasto' },
    { nome: 'Cartões', tipo: 'gasto' },
    { nome: 'Educação', tipo: 'gasto' },
    { nome: 'Outros', tipo: 'gasto' },
    
    // Receitas
    { nome: 'Salário', tipo: 'receita' },
    { nome: 'Bônus / Extras', tipo: 'receita' },
    { nome: 'Rendimentos', tipo: 'receita' }
  ];

  console.log('🌱 Iniciando seeding (JS)...');

  try {
    for (const cat of defaultCategories) {
      const id = `default-${cat.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;
      await prisma.category.upsert({
        where: { id },
        update: {},
        create: {
          id,
          nome: cat.nome,
          tipo: cat.tipo
        }
      });
      console.log(`✅ Categoria cadastrada: ${cat.nome}`);
    }
    console.log('✨ Todas as categorias padrão estão prontas!');
  } catch (err) {
    console.error('❌ Erro no seeding:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
