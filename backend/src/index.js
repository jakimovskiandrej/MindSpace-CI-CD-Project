import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import logsRoutes from './routes/logs.js';
import challengesRoutes from './routes/challenges.js';
import badgesRoutes from './routes/badges.js';
import sentimentRoutes from './routes/sentiment.js';
import groupsRoutes from './routes/groups.js';
import wallRoutes from './routes/wall.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/report.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ status: 'ok', service: 'MindSpace API', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/logs', logsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/wall', wallRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Настана неочекувана серверска грешка.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Рутата не постои.' });
});

app.listen(PORT, () => {
  console.log(`🧠 MindSpace API работи на http://localhost:${PORT}`);
});