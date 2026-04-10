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
      const user = await prisma.user.findUnique({
        where: { id: usuarioId as string },
        select: { familyId: true }
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const investments = await prisma.investment.findMany({
        where: user.familyId 
          ? { user: { familyId: user.familyId } }
          : { usuarioId: usuarioId as string }
      });
      res.status(200).json(investments);
    } catch (err) {
      console.error('List investments error:', err);
      res.status(500).json({ error: 'Erro ao buscar investimentos' });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { descricao, valor, tipo, usuarioId, meta } = req.body;
    
    // Log para depuração
    console.log('--- Novo Investimento ---');
    console.log('Payload:', { descricao, valor, tipo, usuarioId, meta });

    if (!descricao || valor === undefined || !tipo || !usuarioId) {
      res.status(400).json({ error: 'Descricao, valor, tipo e usuarioId são obrigatórios' });
      return;
    }

    try {
      const numValor = Number(valor);
      const numMeta = meta ? Number(meta) : null;

      if (isNaN(numValor)) {
        res.status(400).json({ error: 'O valor do investimento deve ser um número válido' });
        return;
      }

      const userExists = await prisma.user.findUnique({ where: { id: usuarioId } });
      if (!userExists) {
        res.status(401).json({ error: 'Sessão expirada. Por favor, faça logout e login novamente.' });
        return;
      }

      const investment = await prisma.investment.create({
        data: { 
          descricao, 
          valor: numValor, 
          tipo, 
          usuarioId, 
          meta: isNaN(Number(numMeta)) ? null : numMeta 
        }
      });
      
      console.log('Investimento criado com sucesso:', investment.id);
      res.status(201).json(investment);
    } catch (err: any) {
      console.error('ERRO CRÍTICO NO PRISMA (Create Investment):', err);
      res.status(500).json({ 
        error: 'Erro ao criar investimento no banco de dados',
        details: err.message 
      });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { descricao, valor, tipo, meta } = req.body;

    console.log(`--- Atualizando Investimento (${id}) ---`);
    console.log('Novos dados:', { descricao, valor, tipo, meta });

    try {
      const numValor = valor !== undefined ? Number(valor) : undefined;
      const numMeta = meta !== undefined ? (meta === null ? null : Number(meta)) : undefined;

      const investment = await prisma.investment.update({
        where: { id: id as string },
        data: { 
          descricao, 
          valor: isNaN(Number(numValor)) ? undefined : numValor, 
          tipo, 
          meta: isNaN(Number(numMeta)) ? undefined : numMeta 
        }
      });
      res.status(200).json(investment);
    } catch (err: any) {
      console.error('Update investment error:', err);
      res.status(500).json({ 
        error: 'Erro ao atualizar investimento',
        details: err.message
      });
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
