import { Request, Response } from 'express';
import crypto from 'crypto';
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
      let user = await prisma.user.findUnique({
        where: { email: email as string },
        include: { family: true }
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

      // Self-healing: Ensure family has a valid inviteCode
      if (user.family && (!user.family.inviteCode || user.family.inviteCode.length > 10)) {
        const newCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const updatedFamily = await prisma.family.update({
          where: { id: user.family.id },
          data: { inviteCode: newCode }
        });
        user.family = updatedFamily;
      }

      const { senha: _, ...userWithoutPassword } = user;
      res.status(200).json({ 
        message: 'Login realizado com sucesso', 
        user: userWithoutPassword 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (Login):', err);
      res.status(500).json({ error: 'Erro de servidor ao tentar realizar login' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    const { nome, email, senha, inviteCode } = req.body;

    if (!nome || !email || !senha) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email as string }
      });

      if (existingUser) {
        res.status(400).json({ error: 'E-mail já cadastrado' });
        return;
      }

      const hashedPassword = await bcrypt.hash(senha, 10);
      const verificationToken = crypto.randomUUID();

      const newUser = await prisma.$transaction(async (tx) => {
        let familyId: string | null = null;

        if (inviteCode) {
          const family = await tx.family.findUnique({
            where: { inviteCode }
          });
          if (!family) {
            throw new Error('Código de convite inválido');
          }
          familyId = family.id;
        }

        // If no invite code, create a new Family for the user
        if (!familyId) {
          const newFamily = await tx.family.create({
            data: {
                nome: `Família de ${nome.split(' ')[0]}`,
                inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase()
            }
          });
          familyId = newFamily.id;
        }

        const user = await tx.user.create({
          data: {
            nome,
            email,
            senha: hashedPassword,
            verificationToken,
            familyId,
            role: inviteCode ? 'MEMBER' : 'HEAD' // Set as HEAD if they are the creator
          },
          include: { family: true }
        });

        await tx.member.create({
          data: {
            nome,
            usuarioId: user.id
          }
        });

        return user;
      });

      const { senha: _, ...userWithoutPassword } = newUser;

      res.status(201).json({ 
        message: 'Usuário registrado com sucesso!', 
        user: userWithoutPassword 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (Register):', err);
      res.status(500).json({ error: err.message || 'Erro ao registrar usuário.' });
    }
  }

  public async joinFamily(req: Request, res: Response): Promise<void> {
    const { inviteCode, usuarioId } = req.body;

    if (!inviteCode || !usuarioId) {
      res.status(400).json({ error: 'Código e ID do usuário são obrigatórios' });
      return;
    }

    try {
      const family = await prisma.family.findUnique({
        where: { inviteCode }
      });

      if (!family) {
        res.status(404).json({ error: 'Código de convite não encontrado' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: usuarioId as string },
        data: { 
          familyId: family.id,
          role: 'MEMBER' // Joining members are always REGULAR members
        },
        include: { family: true }
      });

      // Self-healing: Ensure user has at least one Member record with their name
      const existingMember = await prisma.member.findFirst({
        where: { usuarioId: usuarioId as string }
      });

      if (!existingMember) {
        await prisma.member.create({
          data: {
            nome: updatedUser.nome.split(' ')[0],
            usuarioId: updatedUser.id
          }
        });
      }

      const { senha: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json({ 
        message: 'Você entrou na família!', 
        user: userWithoutPassword 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (JoinFamily):', err);
      res.status(500).json({ error: 'Erro ao entrar na família' });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, initialBalance, nome } = req.body;
      let user = await prisma.user.update({
        where: { id: usuarioId },
        data: { 
          initialBalance: initialBalance !== undefined ? parseFloat(initialBalance) : undefined,
          nome: nome || undefined
        },
        include: { family: true }
      });

      // Self-healing: Ensure family has a valid inviteCode
      if (user.family && (!user.family.inviteCode || user.family.inviteCode.length > 10)) {
        const newCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const updatedFamily = await prisma.family.update({
          where: { id: user.family.id },
          data: { inviteCode: newCode }
        });
        user.family = updatedFamily;
      } else if (!user.family) {
        // If user has NO family, create one for them
        const newCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const newFamily = await prisma.family.create({
          data: {
              nome: `Família de ${user.nome.split(' ')[0]}`,
              inviteCode: newCode
          }
        });
        user = await prisma.user.update({
            where: { id: usuarioId },
            data: { familyId: newFamily.id, role: 'HEAD' },
            include: { family: true }
        });
      }

      // Self-healing: Ensure user has at least one Member record with their name
      const existingMember = await prisma.member.findFirst({
        where: { usuarioId }
      });

      if (!existingMember) {
        await prisma.member.create({
          data: {
            nome: user.nome.split(' ')[0], // Use first name as default member name
            usuarioId: user.id
          }
        });
      }

      const { senha: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('SERVER_ERROR (UpdateProfile):', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  public async updateFamilyPermissions(req: Request, res: Response): Promise<void> {
    const { familyId, blockedMenus, usuarioId } = req.body;

    if (!familyId || !usuarioId) {
      res.status(400).json({ error: 'ID da família e do usuário são obrigatórios' });
      return;
    }

    try {
      // Security check: Verify if the requesting user is the HEAD of the family
      const user = await prisma.user.findUnique({
        where: { id: usuarioId as string }
      });

      if (!user || user.role !== 'HEAD' || user.familyId !== familyId) {
        res.status(403).json({ error: 'Apenas o chefe da família pode alterar permissões' });
        return;
      }

      const updatedFamily = await prisma.family.update({
        where: { id: familyId as string },
        data: { blockedMenus },
        include: { users: { select: { id: true, nome: true, role: true } } }
      });

      res.status(200).json({ 
        message: 'Permissões atualizadas com sucesso', 
        family: updatedFamily 
      });
    } catch (err: any) {
      console.error('SERVER_ERROR (UpdatePermissions):', err);
      res.status(500).json({ error: 'Erro ao atualizar permissões da família' });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Security practice: Don't reveal if user exists, but here we'll be helpful for now
        res.status(404).json({ error: 'Nenhum usuário encontrado com este e-mail' });
        return;
      }

      const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hour expiry

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires
        }
      });

      // Simulation of email since we don't have SMTP yet
      console.log(`[PASS_RESET] Token para ${email}: ${token}`);
      
      res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código de reset.' });
    } catch (err) {
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          email,
          resetPasswordToken: token,
          resetPasswordExpires: { gte: new Date() }
        }
      });

      if (!user) {
        res.status(400).json({ error: 'Código inválido ou expirado' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          senha: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

      res.json({ message: 'Sua senha foi alterada com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao redefinir a senha' });
    }
  }
}
