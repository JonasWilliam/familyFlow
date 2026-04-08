import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class CardController {
  public async list(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    try {
      const cards = await prisma.card.findMany({
        where: { usuarioId: usuarioId as string }
      });
      res.status(200).json(cards);
    } catch (err) {
      console.error('List cards error:', err);
      res.status(500).json({ error: 'Erro ao buscar cartões' });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { nome, limite, fechamento, vencimento, banco, last4, usuarioId } = req.body;
    if (!nome || limite === undefined || !fechamento || !vencimento || !usuarioId) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    try {
      const card = await prisma.card.create({
        data: { 
          nome, 
          limite, 
          fechamento, 
          vencimento, 
          banco: banco || 'Outros',
          last4: last4 || '0000',
          usuarioId: usuarioId as string 
        }
      });
      res.status(201).json(card);
    } catch (err) {
      console.error('Create card error:', err);
      res.status(500).json({ error: 'Erro ao criar cartão' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nome, limite, fechamento, vencimento, banco, last4 } = req.body;

    try {
      const card = await prisma.card.update({
        where: { id: id as string },
        data: { 
          nome, 
          limite, 
          fechamento, 
          vencimento,
          banco,
          last4
        }
      });
      res.status(200).json(card);
    } catch (err) {
      console.error('Update card error:', err);
      res.status(500).json({ error: 'Erro ao atualizar o cartão' });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.card.delete({
        where: { id: id as string }
      });
      res.status(200).json({ message: 'Cartão removido' });
    } catch (err) {
      console.error('Remove card error:', err);
      res.status(500).json({ error: 'Erro ao remover o cartão' });
    }
  }
}
