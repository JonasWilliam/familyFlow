import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class SettingController {
  public async list(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await prisma.setting.findMany();
      // Transform array [{key: 'a', value: 'b'}] to record {a: 'b'} for frontend
      const settingsRecord = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
      res.status(200).json(settingsRecord);
    } catch (err) {
      console.error('List settings error:', err);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  public async get(req: Request, res: Response): Promise<void> {
    const { key } = req.params;
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: key as string }
      });
      res.status(200).json(setting);
    } catch (err) {
      console.error('Get setting error:', err);
      res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ error: 'Key e value são obrigatórios' });
      return;
    }

    try {
      const setting = await prisma.setting.upsert({
        where: { key: key as string },
        update: { value: String(value) },
        create: { key: key as string, value: String(value) }
      });
      res.status(200).json(setting);
    } catch (err) {
      console.error('Update setting error:', err);
      res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
  }
}
