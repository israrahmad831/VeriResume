import dotenv from 'dotenv';
// Load env vars FIRST before other imports that might use them
dotenv.config();

// Verify JWT_SECRET is loaded
console.log('[Server] JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES (length: ' + process.env.JWT_SECRET.length + ')' : 'NO - using default');

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import passport from 'passport';
import session from 'express-session';
import setupPassport from './config/passport.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Session (required for passport, though we use JWT for API)
app.use(session({ secret: process.env.SESSION_SECRET || 'sesssecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/api', (req, res) => res.json({ message: 'API is working!' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	const gId = process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured';
	console.log(`Google OAuth is ${gId}. Callback URL: ${process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'}`);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});
