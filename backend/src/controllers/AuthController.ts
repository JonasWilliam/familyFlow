import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export class AuthController {
  public async login(req: Request, res: Response): Promise<void> {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email as string }
      });

      if (!user) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(senha, user.senha);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      // Professional Auth usually returns a token, but we keep the user object for now 
      // as the frontend expects it. We can add JWT later for full professional feel.
      const { senha: _, ...userWithoutPassword } = user;

      res.status(200).json({ 
        message: 'Login realizado com sucesso', 
        user: userWithoutPassword 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (Login):', {
        message: err.message,
        stack: err.stack,
        code: err.code
      });
      res.status(500).json({ error: 'Erro de servidor ao tentar realizar login' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email as string }
      });

      if (existingUser) {
        res.status(400).json({ error: 'E-mail já cadastrado' });
        return;
      }

      const hashedPassword = await bcrypt.hash(senha, 10);
      const verificationToken = uuidv4();

      // Start transaction to create User and its first Member
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            nome,
            email,
            senha: hashedPassword,
            verificationToken
          }
        });

        await tx.member.create({
          data: {
            nome,
            usuarioId: user.id
          }
        });

        return user;
      });

      console.log(`[MAIL SIMULATION] Verification email sent to ${email} with token ${verificationToken}`);

      const { senha: _, ...userWithoutPassword } = newUser;

      res.status(201).json({ 
        message: 'Usuário registrado com sucesso!', 
        user: userWithoutPassword 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (Register):', {
        message: err.message,
        stack: err.stack,
        code: err.code
      });
      res.status(500).json({ error: 'Erro ao registrar usuário (Produção).' });
    }
  }
}
