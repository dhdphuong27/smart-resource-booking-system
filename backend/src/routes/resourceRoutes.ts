import express from 'express';
import { getResources, createResource } from '../controllers/resourceController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Everyone can view resources
router.get('/', protect, getResources); 

// Only Admin can create (chaining middlewares)
router.post('/', protect, admin, createResource); 

export default router;