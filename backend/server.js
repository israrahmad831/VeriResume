import dotenv from 'dotenv';
dotenv.config();

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

connectDB();

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
});
