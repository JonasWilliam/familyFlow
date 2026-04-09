import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class InvestmentController {
  public async list(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    try {
      const investments = await prisma.investment.findMany({
        where: { usuarioId: usuarioId as string }
      });
      res.status(200).json(investments);
    } catch (err) {
      console.error('List investments error:', err);
      res.status(500).json({ error: 'Erro ao buscar investimentos' });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { descricao, valor, tipo, usuarioId, meta } = req.body;
    if (!descricao || valor === undefined || !tipo || !usuarioId) {
      res.status(400).json({ error: 'Descricao, valor, tipo e usuarioId são obrigatórios' });
      return;
    }

    try {
      const investment = await prisma.investment.create({
        data: { descricao, valor, tipo, usuarioId, meta }
      });
      res.status(201).json(investment);
    } catch (err) {
      console.error('Create investment error:', err);
      res.status(500).json({ error: 'Erro ao criar investimento' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { descricao, valor, tipo, meta } = req.body;

    try {
      const investment = await prisma.investment.update({
        where: { id: id as string },
        data: { descricao, valor, tipo, meta }
      });
      res.status(200).json(investment);
    } catch (err) {
      console.error('Update investment error:', err);
      res.status(500).json({ error: 'Erro ao atualizar investimento' });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.investment.delete({
        where: { id: id as string }
      });
      res.status(200).json({ message: 'Investimento removido' });
    } catch (err) {
      console.error('Remove investment error:', err);
      res.status(500).json({ error: 'Erro ao remover investimento' });
    }
  }
}
