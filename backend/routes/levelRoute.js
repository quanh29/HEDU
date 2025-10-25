import express from 'express';
import { getLevels } from '../controllers/levelController.js';

const router = express.Router();

// Public: list levels
router.get('/', (req, res) => {
  getLevels(req, res);
});

export default router;
