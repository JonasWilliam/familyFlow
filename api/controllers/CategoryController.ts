import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class CategoryController {
  public async list(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany();
      res.status(200).json(categories);
    } catch (err) {
      console.error('List categories error:', err);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { nome, tipo } = req.body;
    if (!nome || !tipo) {
      res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
      return;
    }

    try {
      const category = await prisma.category.create({
        data: { nome, tipo }
      });
      res.status(201).json(category);
    } catch (err) {
      console.error('Create category error:', err);
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nome, tipo } = req.body;

    try {
      const category = await prisma.category.update({
        where: { id: id as string },
        data: { nome, tipo }
      });
      res.status(200).json(category);
    } catch (err) {
      console.error('Update category error:', err);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.category.delete({
        where: { id: id as string }
      });
      res.status(200).json({ message: 'Categoria removida' });
    } catch (err) {
      console.error('Remove category error:', err);
      res.status(500).json({ error: 'Erro ao remover categoria' });
    }
  }
}
