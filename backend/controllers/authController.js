import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ email, password, name });
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const googleCallback = (req, res) => {
  // after passport sets req.user, issue a JWT and redirect or respond
  const user = req.user;
  if (!user) return res.status(400).json({ message: 'No user from OAuth provider' });
  const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });
  // For simplicity, return token as JSON (in production you may redirect to frontend)
  res.json({ user, token });
};
