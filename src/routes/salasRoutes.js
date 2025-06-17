// src/routes/salaRoutes.js (o customerRoutes.js, según prefieras)

import express from 'express';
import multer from 'multer';

import {
  indexSala,
  storeSala,
  createSala,
  editSala,
  updateSala,
  deleteSala,
  exportFlutter,
  importImg,
  importPromt
} from '../controllers/salaController.js';

import isAuthenticated from '../middlewares/isAuthenticate.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/index-sala', isAuthenticated, indexSala);
router.get('/store-sala', isAuthenticated, storeSala);
router.post('/create-sala', isAuthenticated, createSala);
router.get('/edit-sala/:id', isAuthenticated, editSala);
router.post('/update-sala', isAuthenticated, updateSala);
router.get('/delete-sala/:id', isAuthenticated, deleteSala);

router.post('/import-promt/:id', importPromt);

router.post('/export-flutter', upload.single('imageF'), exportFlutter);
router.post('/import-img/:id', upload.single('image'), importImg);

export default router;
