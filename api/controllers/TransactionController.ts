import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class TransactionController {
  public async create(req: Request, res: Response): Promise<void> {
    console.log('Receiving transaction:', req.body);
    const { 
      descricao, valor, data, categoriaId, membroId, usuarioId, tipo,
      metodoPagamento, cartaoId, parcelaAtual, parcelasTotais 
    } = req.body;
    
    if (!descricao || valor === undefined || !data || !categoriaId || !membroId || !usuarioId || usuarioId === 'null' || usuarioId === 'undefined' || !tipo) {
      console.warn('Invalid or missing fields:', { descricao, valor, data, categoriaId, membroId, usuarioId, tipo });
      res.status(400).json({ error: 'Todos os campos obrigatórios, incluindo o usuário, devem ser preenchidos' });
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
        }
      });
      res.status(201).json({ transaction });
    } catch (err) {
      console.error('DB Insert Error:', err);
      res.status(500).json({ error: 'Erro ao salvar o lançamento' });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    try {
      const transactions = await prisma.transaction.findMany({
        where: { usuarioId: usuarioId as string },
        orderBy: { data: 'desc' }
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
