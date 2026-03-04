// ============================================================================
// ROUTES - API ENDPOINT DEFINITIONS
// ============================================================================

import { Router } from 'express';
import { AuthController, PacketController, EmployeeController, DashboardController } from '../controllers/index.js';
import { authenticateJWT } from '../middleware/index.js';

export function createRoutes(): Router {
  const router = Router();

  const authController = new AuthController();
  const packetController = new PacketController();
  const employeeController = new EmployeeController();
  const dashboardController = new DashboardController();

  // ========================================================================
  // AUTH ROUTES
  // ========================================================================

  router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
  router.post('/auth/register', (req, res, next) => authController.register(req, res, next));
  router.post('/auth/refresh-token', (req, res, next) => authController.refresh(req, res, next));
  router.get('/auth/user', authenticateJWT, (req, res, next) => authController.getUser(req, res, next));

  // ============================================ ============================
  // Dashboard ROUTES (all authenticated)
  // ========================================================================

  router.get('/dashboard', authenticateJWT, (req, res, next) => dashboardController.getDashboard(req, res, next));



  // ============================================ ============================
  // PACKET ROUTES (all authenticated)
  // ========================================================================

  router.post('/packets', authenticateJWT, (req, res, next) => packetController.create(req, res, next));
  router.get('/packets', authenticateJWT, (req, res, next) => packetController.getAll(req, res, next));
  router.get('/packets/status', authenticateJWT, (req, res, next) => packetController.getStatus(req, res, next));
  router.get('/packets/by-status', authenticateJWT, (req, res, next) => packetController.getByStatus(req, res, next));
  router.get('/packets/:id', authenticateJWT, (req, res, next) => packetController.getById(req, res, next));
  router.put('/packets/:id', authenticateJWT, (req, res, next) => packetController.update(req, res, next));
  router.delete('/packets/:id', authenticateJWT, (req, res, next) => packetController.delete(req, res, next));
  router.post('/packets/:id/assign', authenticateJWT, (req, res, next) => packetController.assign(req, res, next));
  router.patch('/packets/:id/status', authenticateJWT, (req, res, next) => packetController.updateStatus(req, res, next));

  // ========================================================================
  // EMPLOYEE ROUTES (all authenticated)
  // ========================================================================

  router.post('/employees', authenticateJWT, (req, res, next) => employeeController.create(req, res, next));
  router.get('/employees', authenticateJWT, (req, res, next) => employeeController.getAll(req, res, next));
  router.get('/employees/:id', authenticateJWT, (req, res, next) => employeeController.getById(req, res, next));
  router.put('/employees/:id', authenticateJWT, (req, res, next) => employeeController.update(req, res, next));
  router.delete('/employees/:id', authenticateJWT, (req, res, next) => employeeController.delete(req, res, next));

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
