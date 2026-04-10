import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.post('/register', (req, res) => authController.register(req, res));
authRoutes.post('/join-family', (req, res) => authController.joinFamily(req, res));
authRoutes.post('/update-permissions', (req, res) => authController.updateFamilyPermissions(req, res));
authRoutes.post('/update-profile', (req, res) => authController.updateProfile(req, res));

export default authRoutes;
