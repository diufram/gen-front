// src/routes/customerRoutes.js

import express from 'express';
import {
  indexSingin,
  indexSingup,
  singin,
  singup,
  logout
} from '../controllers/authenticateController.js';

import isNoAuthenticated from '../middlewares/isNoAuthenticate.js';

const router = express.Router();

router.get('/index-singin', isNoAuthenticated, indexSingin);
router.get('/index-singup', isNoAuthenticated, indexSingup);

router.post('/singin', isNoAuthenticated, singin);
router.post('/singup', isNoAuthenticated, singup);
router.get('/logout', logout);

export default router;
