import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class MemberController {
  public async list(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    try {
      const members = await prisma.member.findMany({
        where: { usuarioId: usuarioId as string }
      });
      res.status(200).json(members);
    } catch (err) {
      console.error('List members error:', err);
      res.status(500).json({ error: 'Erro ao buscar membros' });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { nome, usuarioId } = req.body;
    if (!nome || !usuarioId) {
      res.status(400).json({ error: 'Nome e usuário são obrigatórios' });
      return;
    }

    try {
      const member = await prisma.member.create({
        data: { nome, usuarioId }
      });
      res.status(201).json(member);
    } catch (err) {
      console.error('Create member error:', err);
      res.status(500).json({ error: 'Erro ao criar membro' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nome } = req.body;

    try {
      const member = await prisma.member.update({
        where: { id: id as string },
        data: { nome }
      });
      res.status(200).json(member);
    } catch (err) {
      console.error('Update member error:', err);
      res.status(500).json({ error: 'Erro ao atualizar membro' });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.member.delete({
        where: { id: id as string }
      });
      res.status(200).json({ message: 'Membro removido' });
    } catch (err) {
      console.error('Remove member error:', err);
      res.status(500).json({ error: 'Erro ao remover membro' });
    }
  }
}
