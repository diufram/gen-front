import express from 'express';
import {
  indexSalasCompartidas,
  diagramaCompartido,
  compartir,
  deleteSalaCompartida
} from '../controllers/userSalaController.js';

const router = express.Router();

router.get('/index-sala-compartidas', indexSalasCompartidas);
router.get('/delete-sala-compartida/:id', deleteSalaCompartida);
router.get('/diagrama-compartido/:id', diagramaCompartido);
router.get('/compartir/:id', compartir);

export default router;
