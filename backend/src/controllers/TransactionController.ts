import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class TransactionController {
  public async create(req: Request, res: Response): Promise<void> {
    console.log('Receiving transaction:', req.body);
    const { 
      descricao, valor, data, categoriaId, membroId, usuarioId, tipo,
      metodoPagamento, cartaoId, parcelaAtual, parcelasTotais 
    } = req.body;
    
    const requiredFields = { descricao, valor, data, categoriaId, membroId, usuarioId, tipo };
    const missing = Object.entries(requiredFields)
      .filter(([_, v]) => v === undefined || v === null || v === '' || v === 'null' || v === 'undefined')
      .map(([k]) => k);

    if (missing.length > 0) {
      console.warn('Missing or invalid fields in transaction:', missing);
      res.status(400).json({ 
        error: `Campos obrigatórios ausentes ou inválidos: ${missing.join(', ')}`,
        missing 
      });
      return;
    }

    try {
      const transaction = await prisma.transaction.create({
        data: {
          descricao,
          valor,
          data,
          categoriaId,
          membroId,
          usuarioId,
          tipo,
          metodoPagamento: metodoPagamento || 'dinheiro',
          cartaoId: cartaoId || null,
          parcelaAtual: parcelaAtual || 1,
          parcelasTotais: parcelasTotais || 1
        },
        include: {
          category: true,
          member: true
        }
      });
      res.status(201).json({ transaction });
    } catch (err: any) {
      console.error('DB Insert Error:', err);
      res.status(500).json({ 
        error: 'Erro ao salvar o lançamento',
        details: err.message,
        code: err.code 
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    try {
      // Find user to check their family
      const user = await prisma.user.findUnique({
        where: { id: usuarioId as string },
        select: { familyId: true }
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // If user has family, return all transactions for that family
      const transactions = await prisma.transaction.findMany({
        where: user.familyId 
          ? { user: { familyId: user.familyId } }
          : { usuarioId: usuarioId as string },
        orderBy: [
          { data: 'desc' },
          { createdAt: 'desc' }
        ],
        include: { 
          category: true,
          member: true
        }
      });
      res.status(200).json(transactions);
    } catch (err) {
      console.error('List transactions error:', err);
      res.status(500).json({ error: 'Erro ao buscar lançamentos' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { 
      descricao, valor, data, categoriaId, membroId, tipo,
      metodoPagamento, cartaoId, parcelaAtual, parcelasTotais
    } = req.body;

    try {
      const transaction = await prisma.transaction.update({
        where: { id: id as string },
        data: {
          descricao,
          valor,
          data,
          categoriaId,
          membroId,
          tipo,
          metodoPagamento,
          cartaoId,
          parcelaAtual,
          parcelasTotais
        }
      });
      res.status(200).json(transaction);
    } catch (err) {
      console.error('Update transaction error:', err);
      res.status(500).json({ error: 'Erro ao atualizar' });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await prisma.transaction.delete({
        where: { id: id as string }
      });
      res.status(200).json({ message: 'Lançamento removido' });
    } catch (err) {
      console.error('Remove transaction error:', err);
      res.status(500).json({ error: 'Erro ao remover' });
    }
  }
}
