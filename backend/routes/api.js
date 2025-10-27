import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  // exclude sensitive fields
  res.json({ id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role });
});

export default router;
