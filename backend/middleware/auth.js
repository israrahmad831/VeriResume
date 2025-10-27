import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'devsecret';

export const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth) {
    // mask token for logs
    const parts = auth.split(' ');
    if (parts.length === 2) {
      const t = parts[1];
      console.debug('auth header received (masked):', t.slice(0, 10) + '...' + t.slice(-10));
    } else {
      console.debug('auth header received (raw):', auth);
    }
  }
  if (!auth) return res.status(401).json({ message: 'No authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Invalid authorization header' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verify error:', err && err.message ? err.message : err);
    res.status(401).json({ message: 'Invalid token', error: err && err.message ? err.message : String(err) });
  }
};

export default authMiddleware;
