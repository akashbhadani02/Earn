require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./db');
const Branding = require('./models/Branding');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

app.set('trust proxy', 1);
app.set('io', io);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', database: 'disconnected', message: err.message });
  }
});

// Public branding endpoint used by student pages.
app.get('/api/branding', async (req, res) => {
  try {
    await connectDB();
    const branding = await Branding.findOne({ key: 'global' }).lean();
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, logoData: branding?.logoData || '', version: branding?.version || 1, updatedAt: branding?.updatedAt || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Connect before protected routes execute. This avoids requests hanging when mongoose buffering is disabled.
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  if (!req.path.startsWith('/api/')) return next();
  try { await connectDB(); next(); }
  catch (err) { res.status(503).json({ success:false, message:'Database connection failed', error:err.message }); }
});

const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const bonusRouter = require('./routes/bonus');
const walletRouter = require('./routes/wallet');
const questionsModule = require('./routes/questions');
const bookPurchasesRouter = require('./routes/bookPurchases');
const profileRouter = require('./routes/profile');
const activitiesRouter = require('./routes/activities');
const studentRouter = require('./routes/student');
const notificationsRouter = require('./routes/notifications');

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bonus', bonusRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/questions', questionsModule.router);
app.use('/api/book-purchases', bookPurchasesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/student', studentRouter);
app.use('/api/notifications', notificationsRouter);

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success:false, message:'API endpoint not found' });
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

io.on('connection', socket => {
  socket.on('join', room => { if (room) socket.join(String(room)); });
  socket.on('disconnect', () => {});
});

const PORT = Number(process.env.PORT || 3000);
if (require.main === module) {
  server.listen(PORT, () => console.log(`🚀 Aducate English server running on http://localhost:${PORT}`));
}

module.exports = { app, server, io };

