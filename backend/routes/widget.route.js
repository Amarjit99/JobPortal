import express from 'express';
import { getJobWidget, getEmbedCode } from '../controllers/widget.controller.js';

const router = express.Router();

router.get('/jobs', getJobWidget);
router.get('/embed-code', getEmbedCode);

export default router;
