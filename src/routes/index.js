import express from 'express';
import authRoutes from './authenticateRoutes.js';
import salaRoutes from './salasRoutes.js';
import salaUserRoutes from './salasUserroutes.js';
const router = express.Router();

router.use(authRoutes);  // Todas las rutas de autenticación se manejarán con el enrutador de auth
router.use(salaRoutes); // Todas las rutas de salas
router.use(salaUserRoutes); // Todas las rutas de salas


export default router;

